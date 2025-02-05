package changeset

import (
	"errors"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/gagliardetto/solana-go"
	"github.com/smartcontractkit/ccip-owner-contracts/pkg/proposal/timelock"
	"golang.org/x/sync/errgroup"

	solBinary "github.com/gagliardetto/binary"
	solRpc "github.com/gagliardetto/solana-go/rpc"
	chainsel "github.com/smartcontractkit/chain-selectors"

	solRouter "github.com/smartcontractkit/chainlink-ccip/chains/solana/gobindings/ccip_router"
	solCommonUtil "github.com/smartcontractkit/chainlink-ccip/chains/solana/utils/common"
	solState "github.com/smartcontractkit/chainlink-ccip/chains/solana/utils/state"

	"github.com/smartcontractkit/chainlink/deployment"
	"github.com/smartcontractkit/chainlink/deployment/ccip/changeset/internal"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/ccip_home"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/fee_quoter"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/nonce_manager"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/offramp"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/onramp"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/rmn_home"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/rmn_remote"
	"github.com/smartcontractkit/chainlink/v2/core/gethwrappers/ccip/generated/router"
)

var _ deployment.ChangeSet[DeployChainContractsConfig] = DeployChainContractsChangeset

var (
	EnableExecutionAfter = int64(1800) // 30min
)

// DeployChainContracts deploys all new CCIP v1.6 or later contracts for the given chains.
// It returns the new addresses for the contracts.
// DeployChainContractsChangeset is idempotent. If there is an error, it will return the successfully deployed addresses and the error so that the caller can call the
// changeset again with the same input to retry the failed deployment.
// Caller should update the environment's address book with the returned addresses.
// Points to note :
// In case of migrating from legacy ccip to 1.6, the previous RMN address should be set while deploying RMNRemote.
// if there is no existing RMN address found, RMNRemote will be deployed with 0x0 address for previous RMN address
// which will set RMN to 0x0 address immutably in RMNRemote.
func DeployChainContractsChangeset(env deployment.Environment, c DeployChainContractsConfig) (deployment.ChangesetOutput, error) {
	if err := c.Validate(); err != nil {
		return deployment.ChangesetOutput{}, fmt.Errorf("invalid DeployChainContractsConfig: %w", err)
	}
	newAddresses := deployment.NewMemoryAddressBook()
	err := deployChainContractsForChains(env, newAddresses, c.HomeChainSelector, c.ContractParamsPerChain)
	if err != nil {
		env.Logger.Errorw("Failed to deploy CCIP contracts", "err", err, "newAddresses", newAddresses)
		return deployment.ChangesetOutput{AddressBook: newAddresses}, deployment.MaybeDataErr(err)
	}
	return deployment.ChangesetOutput{
		Proposals:   []timelock.MCMSWithTimelockProposal{},
		AddressBook: newAddresses,
	}, nil
}

type DeployChainContractsConfig struct {
	HomeChainSelector      uint64
	ContractParamsPerChain map[uint64]ChainContractParams
}

func (c DeployChainContractsConfig) Validate() error {
	if err := deployment.IsValidChainSelector(c.HomeChainSelector); err != nil {
		return fmt.Errorf("invalid home chain selector: %d - %w", c.HomeChainSelector, err)
	}
	for cs, args := range c.ContractParamsPerChain {
		if err := deployment.IsValidChainSelector(cs); err != nil {
			return fmt.Errorf("invalid chain selector: %d - %w", cs, err)
		}
		if err := args.Validate(); err != nil {
			return fmt.Errorf("invalid contract args for chain %d: %w", cs, err)
		}
	}
	return nil
}

type ChainContractParams struct {
	FeeQuoterParams FeeQuoterParams
	OffRampParams   OffRampParams
}

func (c ChainContractParams) Validate() error {
	if err := c.FeeQuoterParams.Validate(); err != nil {
		return fmt.Errorf("invalid FeeQuoterParams: %w", err)
	}
	if err := c.OffRampParams.Validate(false); err != nil {
		return fmt.Errorf("invalid OffRampParams: %w", err)
	}
	return nil
}

type FeeQuoterParamsOld struct {
	MaxFeeJuelsPerMsg              *big.Int
	TokenPriceStalenessThreshold   uint32
	LinkPremiumMultiplierWeiPerEth uint64
	WethPremiumMultiplierWeiPerEth uint64
}

type FeeQuoterParams struct {
	MaxFeeJuelsPerMsg              *big.Int
	TokenPriceStalenessThreshold   uint32
	LinkPremiumMultiplierWeiPerEth uint64
	WethPremiumMultiplierWeiPerEth uint64
	MorePremiumMultiplierWeiPerEth []fee_quoter.FeeQuoterPremiumMultiplierWeiPerEthArgs
	TokenPriceFeedUpdates          []fee_quoter.FeeQuoterTokenPriceFeedUpdate
	TokenTransferFeeConfigArgs     []fee_quoter.FeeQuoterTokenTransferFeeConfigArgs
	DestChainConfigArgs            []fee_quoter.FeeQuoterDestChainConfigArgs
}

func (c FeeQuoterParams) Validate() error {
	if c.MaxFeeJuelsPerMsg == nil {
		return errors.New("MaxFeeJuelsPerMsg is nil")
	}
	if c.MaxFeeJuelsPerMsg.Cmp(big.NewInt(0)) <= 0 {
		return errors.New("MaxFeeJuelsPerMsg must be positive")
	}
	if c.TokenPriceStalenessThreshold == 0 {
		return errors.New("TokenPriceStalenessThreshold can't be 0")
	}
	return nil
}

func DefaultFeeQuoterParams() FeeQuoterParams {
	return FeeQuoterParams{
		MaxFeeJuelsPerMsg:              big.NewInt(0).Mul(big.NewInt(2e2), big.NewInt(1e18)),
		TokenPriceStalenessThreshold:   uint32(24 * 60 * 60),
		LinkPremiumMultiplierWeiPerEth: 9e17, // 0.9 ETH
		WethPremiumMultiplierWeiPerEth: 1e18, // 1.0 ETH
		TokenPriceFeedUpdates:          []fee_quoter.FeeQuoterTokenPriceFeedUpdate{},
		TokenTransferFeeConfigArgs:     []fee_quoter.FeeQuoterTokenTransferFeeConfigArgs{},
		MorePremiumMultiplierWeiPerEth: []fee_quoter.FeeQuoterPremiumMultiplierWeiPerEthArgs{},
		DestChainConfigArgs:            []fee_quoter.FeeQuoterDestChainConfigArgs{},
	}
}

type OffRampParams struct {
	GasForCallExactCheck                    uint16
	PermissionLessExecutionThresholdSeconds uint32
	IsRMNVerificationDisabled               bool
	MessageInterceptor                      common.Address
}

func (c OffRampParams) Validate(ignoreGasForCallExactCheck bool) error {
	if !ignoreGasForCallExactCheck && c.GasForCallExactCheck == 0 {
		return errors.New("GasForCallExactCheck is 0")
	}
	if c.PermissionLessExecutionThresholdSeconds == 0 {
		return errors.New("PermissionLessExecutionThresholdSeconds is 0")
	}
	return nil
}

func DefaultOffRampParams() OffRampParams {
	return OffRampParams{
		GasForCallExactCheck:                    uint16(5000),
		PermissionLessExecutionThresholdSeconds: uint32(24 * 60 * 60),
		IsRMNVerificationDisabled:               true,
	}
}

func validateHomeChainState(e deployment.Environment, homeChainSel uint64, existingState CCIPOnChainState) error {
	existingState, err := LoadOnchainState(e)
	if err != nil {
		e.Logger.Errorw("Failed to load existing onchain state", "err", err)
		return err
	}
	capReg := existingState.Chains[homeChainSel].CapabilityRegistry
	if capReg == nil {
		e.Logger.Errorw("Failed to get capability registry")
		return errors.New("capability registry not found")
	}
	cr, err := capReg.GetHashedCapabilityId(
		&bind.CallOpts{}, internal.CapabilityLabelledName, internal.CapabilityVersion)
	if err != nil {
		e.Logger.Errorw("Failed to get hashed capability id", "err", err)
		return err
	}
	if cr != internal.CCIPCapabilityID {
		return fmt.Errorf("unexpected mismatch between calculated ccip capability id (%s) and expected ccip capability id constant (%s)",
			hexutil.Encode(cr[:]),
			hexutil.Encode(internal.CCIPCapabilityID[:]))
	}
	capability, err := capReg.GetCapability(nil, internal.CCIPCapabilityID)
	if err != nil {
		e.Logger.Errorw("Failed to get capability", "err", err)
		return err
	}
	ccipHome, err := ccip_home.NewCCIPHome(capability.ConfigurationContract, e.Chains[homeChainSel].Client)
	if err != nil {
		e.Logger.Errorw("Failed to get ccip config", "err", err)
		return err
	}
	if ccipHome.Address() != existingState.Chains[homeChainSel].CCIPHome.Address() {
		return errors.New("ccip home address mismatch")
	}
	rmnHome := existingState.Chains[homeChainSel].RMNHome
	if rmnHome == nil {
		e.Logger.Errorw("Failed to get rmn home", "err", err)
		return errors.New("rmn home not found")
	}
	return nil
}

func deployChainContractsForChains(
	e deployment.Environment,
	ab deployment.AddressBook,
	homeChainSel uint64,
	contractParamsPerChain map[uint64]ChainContractParams) error {
	existingState, err := LoadOnchainState(e)
	if err != nil {
		e.Logger.Errorw("Failed to load existing onchain state", "err", err)
		return err
	}

	err = validateHomeChainState(e, homeChainSel, existingState)
	if err != nil {
		return err
	}

	rmnHome := existingState.Chains[homeChainSel].RMNHome

	deployGrp := errgroup.Group{}

	for chainSel, contractParams := range contractParamsPerChain {
		if _, exists := existingState.SupportedChains()[chainSel]; !exists {
			return fmt.Errorf("chain %d not supported", chainSel)
		}
		// already validated family
		family, _ := chainsel.GetSelectorFamily(chainSel)
		var deployFn func() error
		switch family {
		case chainsel.FamilyEVM:
			staticLinkExists := existingState.Chains[chainSel].StaticLinkToken != nil
			linkExists := existingState.Chains[chainSel].LinkToken != nil
			weth9Exists := existingState.Chains[chainSel].Weth9 != nil
			feeTokensAreValid := weth9Exists && (linkExists != staticLinkExists)
			if !feeTokensAreValid {
				return fmt.Errorf("fee tokens not valid for chain %d, staticLinkExists: %t, linkExists: %t, weth9Exists: %t", chainSel, staticLinkExists, linkExists, weth9Exists)
			}
			chain := e.Chains[chainSel]
			deployFn = func() error { return deployChainContractsEVM(e, chain, ab, rmnHome, contractParams) }

		case chainsel.FamilySolana:
			chain := e.SolChains[chainSel]
			if existingState.SolChains[chainSel].LinkToken.IsZero() {
				return fmt.Errorf("fee tokens not found for chain %d", chainSel)
			}
			deployFn = func() error { return deployChainContractsSolana(e, chain, ab) }
		default:
			return fmt.Errorf("unsupported chain family for chain %d", chainSel)
		}
		deployGrp.Go(func() error {
			err := deployFn()
			if err != nil {
				e.Logger.Errorw("Failed to deploy chain contracts", "chain", chainSel, "err", err)
				return fmt.Errorf("failed to deploy chain contracts for chain %d: %w", chainSel, err)
			}
			return nil
		})
	}
	if err := deployGrp.Wait(); err != nil {
		e.Logger.Errorw("Failed to deploy chain contracts", "err", err)
		return err
	}
	return nil
}

func deployChainContractsEVM(e deployment.Environment, chain deployment.Chain, ab deployment.AddressBook, rmnHome *rmn_home.RMNHome, contractParams ChainContractParams) error {
	// check for existing contracts
	state, err := LoadOnchainState(e)
	if err != nil {
		e.Logger.Errorw("Failed to load existing onchain state", "err", err)
		return err
	}
	chainState, chainExists := state.Chains[chain.Selector]
	if !chainExists {
		return fmt.Errorf("chain %s not found in existing state, deploy the prerequisites first", chain.String())
	}
	if chainState.Weth9 == nil {
		return fmt.Errorf("weth9 not found for chain %s, deploy the prerequisites first", chain.String())
	}
	if chainState.Timelock == nil {
		return fmt.Errorf("timelock not found for chain %s, deploy the mcms contracts first", chain.String())
	}
	weth9Contract := chainState.Weth9
	linkTokenContractAddr, err := chainState.LinkTokenAddress()
	if err != nil {
		return fmt.Errorf("failed to get link token address for chain %s: %w", chain.String(), err)
	}
	if chainState.TokenAdminRegistry == nil {
		return fmt.Errorf("token admin registry not found for chain %s, deploy the prerequisites first", chain.String())
	}
	tokenAdminReg := chainState.TokenAdminRegistry
	if chainState.RegistryModule == nil {
		return fmt.Errorf("registry module not found for chain %s, deploy the prerequisites first", chain.String())
	}
	if chainState.Router == nil {
		return fmt.Errorf("router not found for chain %s, deploy the prerequisites first", chain.String())
	}
	RMNProxy := chainState.RMNProxy
	if chainState.RMNProxy == nil {
		e.Logger.Errorw("RMNProxy not found", "chain", chain.String())
		return fmt.Errorf("rmn proxy not found for chain %s, deploy the prerequisites first", chain.String())
	}
	var rmnLegacyAddr common.Address
	if chainState.MockRMN != nil {
		rmnLegacyAddr = chainState.MockRMN.Address()
	}
	// If RMN is deployed, set rmnLegacyAddr to the RMN address
	if chainState.RMN != nil {
		rmnLegacyAddr = chainState.RMN.Address()
	}
	if rmnLegacyAddr == (common.Address{}) {
		e.Logger.Warnf("No legacy RMN contract found for chain %s, will not setRMN in RMNRemote", chain.String())
	}
	rmnRemoteContract := chainState.RMNRemote
	if chainState.RMNRemote == nil {
		// TODO: Correctly configure RMN remote.
		rmnRemote, err := deployment.DeployContract(e.Logger, chain, ab,
			func(chain deployment.Chain) deployment.ContractDeploy[*rmn_remote.RMNRemote] {
				rmnRemoteAddr, tx, rmnRemote, err2 := rmn_remote.DeployRMNRemote(
					chain.DeployerKey,
					chain.Client,
					chain.Selector,
					rmnLegacyAddr,
				)
				return deployment.ContractDeploy[*rmn_remote.RMNRemote]{
					Address: rmnRemoteAddr, Contract: rmnRemote, Tx: tx, Tv: deployment.NewTypeAndVersion(RMNRemote, deployment.Version1_6_0_dev), Err: err2,
				}
			})
		if err != nil {
			e.Logger.Errorw("Failed to deploy RMNRemote", "chain", chain.String(), "err", err)
			return err
		}
		rmnRemoteContract = rmnRemote.Contract
	} else {
		e.Logger.Infow("rmn remote already deployed", "chain", chain.String(), "addr", chainState.RMNRemote.Address)
	}

	activeDigest, err := rmnHome.GetActiveDigest(&bind.CallOpts{})
	if err != nil {
		e.Logger.Errorw("Failed to get active digest", "chain", chain.String(), "err", err)
		return err
	}
	e.Logger.Infow("setting active home digest to rmn remote", "chain", chain.String(), "digest", activeDigest)

	tx, err := rmnRemoteContract.SetConfig(chain.DeployerKey, rmn_remote.RMNRemoteConfig{
		RmnHomeContractConfigDigest: activeDigest,
		Signers: []rmn_remote.RMNRemoteSigner{
			{NodeIndex: 0, OnchainPublicKey: common.Address{1}},
		},
		FSign: 0, // TODO: update when we have signers
	})
	if _, err := deployment.ConfirmIfNoError(chain, tx, err); err != nil {
		e.Logger.Errorw("Failed to confirm RMNRemote config", "chain", chain.String(), "err", err)
		return err
	}
	if chainState.TestRouter == nil {
		_, err := deployment.DeployContract(e.Logger, chain, ab,
			func(chain deployment.Chain) deployment.ContractDeploy[*router.Router] {
				routerAddr, tx2, routerC, err2 := router.DeployRouter(
					chain.DeployerKey,
					chain.Client,
					chainState.Weth9.Address(),
					RMNProxy.Address(),
				)
				return deployment.ContractDeploy[*router.Router]{
					Address: routerAddr, Contract: routerC, Tx: tx2, Tv: deployment.NewTypeAndVersion(TestRouter, deployment.Version1_2_0), Err: err2,
				}
			})
		if err != nil {
			e.Logger.Errorw("Failed to deploy test router", "chain", chain.String(), "err", err)
			return err
		}
	} else {
		e.Logger.Infow("test router already deployed", "chain", chain.String(), "addr", chainState.TestRouter.Address)
	}

	nmContract := chainState.NonceManager
	if chainState.NonceManager == nil {
		nonceManager, err := deployment.DeployContract(e.Logger, chain, ab,
			func(chain deployment.Chain) deployment.ContractDeploy[*nonce_manager.NonceManager] {
				nonceManagerAddr, tx2, nonceManager, err2 := nonce_manager.DeployNonceManager(
					chain.DeployerKey,
					chain.Client,
					[]common.Address{}, // Need to add onRamp after
				)
				return deployment.ContractDeploy[*nonce_manager.NonceManager]{
					Address: nonceManagerAddr, Contract: nonceManager, Tx: tx2, Tv: deployment.NewTypeAndVersion(NonceManager, deployment.Version1_6_0_dev), Err: err2,
				}
			})
		if err != nil {
			e.Logger.Errorw("Failed to deploy nonce manager", "chain", chain.String(), "err", err)
			return err
		}
		nmContract = nonceManager.Contract
	} else {
		e.Logger.Infow("nonce manager already deployed", "chain", chain.String(), "addr", chainState.NonceManager.Address)
	}
	feeQuoterContract := chainState.FeeQuoter
	if chainState.FeeQuoter == nil {
		feeQuoter, err := deployment.DeployContract(e.Logger, chain, ab,
			func(chain deployment.Chain) deployment.ContractDeploy[*fee_quoter.FeeQuoter] {
				prAddr, tx2, pr, err2 := fee_quoter.DeployFeeQuoter(
					chain.DeployerKey,
					chain.Client,
					fee_quoter.FeeQuoterStaticConfig{
						MaxFeeJuelsPerMsg:            contractParams.FeeQuoterParams.MaxFeeJuelsPerMsg,
						LinkToken:                    linkTokenContractAddr,
						TokenPriceStalenessThreshold: contractParams.FeeQuoterParams.TokenPriceStalenessThreshold,
					},
					[]common.Address{state.Chains[chain.Selector].Timelock.Address()}, // timelock should be able to update, ramps added after
					[]common.Address{weth9Contract.Address(), linkTokenContractAddr},  // fee tokens
					contractParams.FeeQuoterParams.TokenPriceFeedUpdates,
					contractParams.FeeQuoterParams.TokenTransferFeeConfigArgs,
					append([]fee_quoter.FeeQuoterPremiumMultiplierWeiPerEthArgs{
						{
							PremiumMultiplierWeiPerEth: contractParams.FeeQuoterParams.LinkPremiumMultiplierWeiPerEth,
							Token:                      linkTokenContractAddr,
						},
						{
							PremiumMultiplierWeiPerEth: contractParams.FeeQuoterParams.WethPremiumMultiplierWeiPerEth,
							Token:                      weth9Contract.Address(),
						},
					}, contractParams.FeeQuoterParams.MorePremiumMultiplierWeiPerEth...),
					contractParams.FeeQuoterParams.DestChainConfigArgs,
				)
				return deployment.ContractDeploy[*fee_quoter.FeeQuoter]{
					Address: prAddr, Contract: pr, Tx: tx2, Tv: deployment.NewTypeAndVersion(FeeQuoter, deployment.Version1_6_0_dev), Err: err2,
				}
			})
		if err != nil {
			e.Logger.Errorw("Failed to deploy fee quoter", "chain", chain.String(), "err", err)
			return err
		}
		feeQuoterContract = feeQuoter.Contract
	} else {
		e.Logger.Infow("fee quoter already deployed", "chain", chain.String(), "addr", chainState.FeeQuoter.Address)
	}
	onRampContract := chainState.OnRamp
	if onRampContract == nil {
		onRamp, err := deployment.DeployContract(e.Logger, chain, ab,
			func(chain deployment.Chain) deployment.ContractDeploy[*onramp.OnRamp] {
				onRampAddr, tx2, onRamp, err2 := onramp.DeployOnRamp(
					chain.DeployerKey,
					chain.Client,
					onramp.OnRampStaticConfig{
						ChainSelector:      chain.Selector,
						RmnRemote:          RMNProxy.Address(),
						NonceManager:       nmContract.Address(),
						TokenAdminRegistry: tokenAdminReg.Address(),
					},
					onramp.OnRampDynamicConfig{
						FeeQuoter:     feeQuoterContract.Address(),
						FeeAggregator: chain.DeployerKey.From, // TODO real fee aggregator, using deployer key for now
					},
					[]onramp.OnRampDestChainConfigArgs{},
				)
				return deployment.ContractDeploy[*onramp.OnRamp]{
					Address: onRampAddr, Contract: onRamp, Tx: tx2, Tv: deployment.NewTypeAndVersion(OnRamp, deployment.Version1_6_0_dev), Err: err2,
				}
			})
		if err != nil {
			e.Logger.Errorw("Failed to deploy onramp", "chain", chain.String(), "err", err)
			return err
		}
		onRampContract = onRamp.Contract
	} else {
		e.Logger.Infow("onramp already deployed", "chain", chain.String(), "addr", chainState.OnRamp.Address)
	}
	offRampContract := chainState.OffRamp
	if offRampContract == nil {
		offRamp, err := deployment.DeployContract(e.Logger, chain, ab,
			func(chain deployment.Chain) deployment.ContractDeploy[*offramp.OffRamp] {
				offRampAddr, tx2, offRamp, err2 := offramp.DeployOffRamp(
					chain.DeployerKey,
					chain.Client,
					offramp.OffRampStaticConfig{
						ChainSelector:        chain.Selector,
						GasForCallExactCheck: contractParams.OffRampParams.GasForCallExactCheck,
						RmnRemote:            RMNProxy.Address(),
						NonceManager:         nmContract.Address(),
						TokenAdminRegistry:   tokenAdminReg.Address(),
					},
					offramp.OffRampDynamicConfig{
						FeeQuoter:                               feeQuoterContract.Address(),
						PermissionLessExecutionThresholdSeconds: contractParams.OffRampParams.PermissionLessExecutionThresholdSeconds,
						IsRMNVerificationDisabled:               contractParams.OffRampParams.IsRMNVerificationDisabled,
						MessageInterceptor:                      contractParams.OffRampParams.MessageInterceptor,
					},
					[]offramp.OffRampSourceChainConfigArgs{},
				)
				return deployment.ContractDeploy[*offramp.OffRamp]{
					Address: offRampAddr, Contract: offRamp, Tx: tx2, Tv: deployment.NewTypeAndVersion(OffRamp, deployment.Version1_6_0_dev), Err: err2,
				}
			})
		if err != nil {
			e.Logger.Errorw("Failed to deploy offramp", "chain", chain.String(), "err", err)
			return err
		}
		offRampContract = offRamp.Contract
	} else {
		e.Logger.Infow("offramp already deployed", "chain", chain.String(), "addr", chainState.OffRamp.Address)
	}
	// Basic wiring is always needed.
	tx, err = feeQuoterContract.ApplyAuthorizedCallerUpdates(chain.DeployerKey, fee_quoter.AuthorizedCallersAuthorizedCallerArgs{
		// TODO: We enable the deployer initially to set prices
		// Should be removed after.
		AddedCallers: []common.Address{offRampContract.Address(), chain.DeployerKey.From},
	})
	if _, err := deployment.ConfirmIfNoError(chain, tx, err); err != nil {
		e.Logger.Errorw("Failed to confirm fee quoter authorized caller update", "chain", chain.String(), "err", err)
		return err
	}
	e.Logger.Infow("Added fee quoter authorized callers", "chain", chain.String(), "callers", []common.Address{offRampContract.Address(), chain.DeployerKey.From})
	tx, err = nmContract.ApplyAuthorizedCallerUpdates(chain.DeployerKey, nonce_manager.AuthorizedCallersAuthorizedCallerArgs{
		AddedCallers: []common.Address{offRampContract.Address(), onRampContract.Address()},
	})
	if _, err := deployment.ConfirmIfNoError(chain, tx, err); err != nil {
		e.Logger.Errorw("Failed to update nonce manager with ramps", "chain", chain.String(), "err", err)
		return err
	}
	e.Logger.Infow("Added nonce manager authorized callers", "chain", chain.String(), "callers", []common.Address{offRampContract.Address(), onRampContract.Address()})
	return nil
}

// TODO: move everything below to solana file
func solRouterProgramData(e deployment.Environment, chain deployment.SolChain, ccipRouterProgram solana.PublicKey) (struct {
	DataType uint32
	Address  solana.PublicKey
}, error) {
	var programData struct {
		DataType uint32
		Address  solana.PublicKey
	}
	data, err := chain.Client.GetAccountInfoWithOpts(e.GetContext(), ccipRouterProgram, &solRpc.GetAccountInfoOpts{
		Commitment: solRpc.CommitmentConfirmed,
	})
	if err != nil {
		return programData, fmt.Errorf("failed to deploy program: %w", err)
	}

	err = solBinary.UnmarshalBorsh(&programData, data.Bytes())
	if err != nil {
		return programData, fmt.Errorf("failed to unmarshal program data: %w", err)
	}
	return programData, nil
}

func initializeRouter(e deployment.Environment, chain deployment.SolChain, ccipRouterProgram solana.PublicKey, linkTokenAddress solana.PublicKey) error {
	programData, err := solRouterProgramData(e, chain, ccipRouterProgram)
	if err != nil {
		return fmt.Errorf("failed to get solana router program data: %w", err)
	}
	// addressing errcheck in the next PR
	routerConfigPDA, _, _ := solState.FindConfigPDA(ccipRouterProgram)
	routerStatePDA, _, _ := solState.FindStatePDA(ccipRouterProgram)
	externalExecutionConfigPDA, _, _ := solState.FindExternalExecutionConfigPDA(ccipRouterProgram)
	externalTokenPoolsSignerPDA, _, _ := solState.FindExternalTokenPoolsSignerPDA(ccipRouterProgram)

	instruction, err := solRouter.NewInitializeInstruction(
		chain.Selector,                         // chain selector
		deployment.SolDefaultGasLimit,          // default gas limit
		true,                                   // allow out of order execution
		EnableExecutionAfter,                   // period to wait before allowing manual execution
		solana.PublicKey{},                     // fee aggregator (TODO: changeset to set the fee aggregator)
		linkTokenAddress,                       // link token mint
		deployment.SolDefaultMaxFeeJuelsPerMsg, // max fee juels per msg
		routerConfigPDA,
		routerStatePDA,
		chain.DeployerKey.PublicKey(),
		solana.SystemProgramID,
		ccipRouterProgram,
		programData.Address,
		externalExecutionConfigPDA,
		externalTokenPoolsSignerPDA,
	).ValidateAndBuild()

	if err != nil {
		return fmt.Errorf("failed to build instruction: %w", err)
	}
	if err := chain.Confirm([]solana.Instruction{instruction}); err != nil {
		return fmt.Errorf("failed to confirm instructions: %w", err)
	}
	e.Logger.Infow("Initialized router", "chain", chain.String())
	return nil
}

func deployChainContractsSolana(
	e deployment.Environment,
	chain deployment.SolChain,
	ab deployment.AddressBook,
) error {
	state, err := LoadOnchainStateSolana(e)
	if err != nil {
		e.Logger.Errorw("Failed to load existing onchain state", "err", err)
		return err
	}
	chainState, chainExists := state.SolChains[chain.Selector]
	if !chainExists {
		return fmt.Errorf("chain %s not found in existing state, deploy the link token first", chain.String())
	}
	if chainState.LinkToken.IsZero() {
		return fmt.Errorf("failed to get link token address for chain %s", chain.String())
	}

	// ROUTER DEPLOY AND INITIALIZE
	var ccipRouterProgram solana.PublicKey
	if chainState.Router.IsZero() {
		// deploy router
		programID, err := chain.DeployProgram(e.Logger, "ccip_router")
		if err != nil {
			return fmt.Errorf("failed to deploy program: %w", err)
		}

		tv := deployment.NewTypeAndVersion(Router, deployment.Version1_0_0)
		e.Logger.Infow("Deployed contract", "Contract", tv.String(), "addr", programID, "chain", chain.String())

		ccipRouterProgram = solana.MustPublicKeyFromBase58(programID)
		err = ab.Save(chain.Selector, programID, tv)
		if err != nil {
			return fmt.Errorf("failed to save address: %w", err)
		}
	} else {
		e.Logger.Infow("Using existing router", "addr", chainState.Router.String())
		ccipRouterProgram = chainState.Router
	}
	solRouter.SetProgramID(ccipRouterProgram)

	// check if solana router is initialised
	var routerConfigAccount solRouter.Config
	// addressing errcheck in the next PR
	routerConfigPDA, _, _ := solState.FindConfigPDA(ccipRouterProgram)
	err = chain.GetAccountDataBorshInto(e.GetContext(), routerConfigPDA, &routerConfigAccount)
	if err != nil {
		if err2 := initializeRouter(e, chain, ccipRouterProgram, chainState.LinkToken); err2 != nil {
			return err2
		}
	} else {
		e.Logger.Infow("Router already initialized, skipping initialization", "chain", chain.String())
	}

	var tokenPoolProgram solana.PublicKey
	if chainState.TokenPool.IsZero() {
		// TODO: there should be two token pools deployed one of each type (lock/burn)
		// separate token pools are not ready yet
		programID, err := chain.DeployProgram(e.Logger, "token_pool")
		if err != nil {
			return fmt.Errorf("failed to deploy program: %w", err)
		}
		tv := deployment.NewTypeAndVersion(TokenPool, deployment.Version1_0_0)
		e.Logger.Infow("Deployed contract", "Contract", tv.String(), "addr", programID, "chain", chain.String())
		tokenPoolProgram = solana.MustPublicKeyFromBase58(programID)
		err = ab.Save(chain.Selector, programID, tv)
		if err != nil {
			return fmt.Errorf("failed to save address: %w", err)
		}
	} else {
		e.Logger.Infow("Using existing token pool", "addr", chainState.TokenPool.String())
		tokenPoolProgram = chainState.TokenPool
	}

	// initialize this last with every address we need
	if chainState.AddressLookupTable.IsZero() {
		// addressing errcheck in the next PR
		routerConfigPDA, _, _ := solState.FindConfigPDA(ccipRouterProgram)
		routerStatePDA, _, _ := solState.FindStatePDA(ccipRouterProgram)
		externalExecutionConfigPDA, _, _ := solState.FindExternalExecutionConfigPDA(ccipRouterProgram)
		externalTokenPoolsSignerPDA, _, _ := solState.FindExternalTokenPoolsSignerPDA(ccipRouterProgram)
		table, err := solCommonUtil.SetupLookupTable(
			e.GetContext(),
			chain.Client,
			*chain.DeployerKey,
			[]solana.PublicKey{
				// system
				solana.SystemProgramID,
				solana.ComputeBudget,
				solana.SysVarInstructionsPubkey,
				// router
				ccipRouterProgram,
				routerConfigPDA,
				routerStatePDA,
				externalExecutionConfigPDA,
				externalTokenPoolsSignerPDA,
				// token pools
				tokenPoolProgram,
				// token
				solana.Token2022ProgramID,
				solana.TokenProgramID,
				solana.SPLAssociatedTokenAccountProgramID,
			})
		if err != nil {
			return fmt.Errorf("failed to create lookup table: %w", err)
		}
		err = ab.Save(chain.Selector, table.String(), deployment.NewTypeAndVersion(AddressLookupTable, deployment.Version1_0_0))
		if err != nil {
			return fmt.Errorf("failed to save address: %w", err)
		}
	}
	return nil
}
