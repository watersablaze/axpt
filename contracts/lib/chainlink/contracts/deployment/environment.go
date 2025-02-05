package deployment

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math/big"
	"sort"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/rpc"
	chain_selectors "github.com/smartcontractkit/chain-selectors"
	types2 "github.com/smartcontractkit/libocr/offchainreporting2/types"
	types3 "github.com/smartcontractkit/libocr/offchainreporting2plus/types"
	"google.golang.org/grpc"

	"github.com/smartcontractkit/chainlink-common/pkg/logger"
	csav1 "github.com/smartcontractkit/chainlink-protos/job-distributor/v1/csa"
	jobv1 "github.com/smartcontractkit/chainlink-protos/job-distributor/v1/job"
	nodev1 "github.com/smartcontractkit/chainlink-protos/job-distributor/v1/node"
	"github.com/smartcontractkit/chainlink-protos/job-distributor/v1/shared/ptypes"

	"github.com/smartcontractkit/chainlink/v2/core/services/keystore/keys/p2pkey"
)

// OnchainClient is an EVM chain client.
// For EVM specifically we can use existing geth interface
// to abstract chain clients.
type OnchainClient interface {
	bind.ContractBackend
	bind.DeployBackend
	BalanceAt(ctx context.Context, account common.Address, blockNumber *big.Int) (*big.Int, error)
	NonceAt(ctx context.Context, account common.Address, blockNumber *big.Int) (uint64, error)
}

// OffchainClient interacts with the job-distributor
// which is a family agnostic interface for performing
// DON operations.
type OffchainClient interface {
	jobv1.JobServiceClient
	nodev1.NodeServiceClient
	csav1.CSAServiceClient
}

// Chain represents an EVM chain.
type Chain struct {
	// Selectors used as canonical chain identifier.
	Selector uint64
	Client   OnchainClient
	// Note the Sign function can be abstract supporting a variety of key storage mechanisms (e.g. KMS etc).
	DeployerKey *bind.TransactOpts
	Confirm     func(tx *types.Transaction) (uint64, error)
	// Users are a set of keys that can be used to interact with the chain.
	// These are distinct from the deployer key.
	Users []*bind.TransactOpts
}

func (c Chain) String() string {
	chainInfo, err := ChainInfo(c.Selector)
	if err != nil {
		// we should never get here, if the selector is invalid it should not be in the environment
		panic(err)
	}
	return fmt.Sprintf("%s (%d)", chainInfo.ChainName, chainInfo.ChainSelector)
}

func (c Chain) Name() string {
	chainInfo, err := ChainInfo(c.Selector)
	if err != nil {
		// we should never get here, if the selector is invalid it should not be in the environment
		panic(err)
	}
	if chainInfo.ChainName == "" {
		return strconv.FormatUint(c.Selector, 10)
	}
	return chainInfo.ChainName
}

// Environment represents an instance of a deployed product
// including on and offchain components. It is intended to be
// cross-family to enable a coherent view of a product deployed
// to all its chains.
// TODO: Add SolChains, AptosChain etc.
// using Go bindings/libraries from their respective
// repositories i.e. chainlink-solana, chainlink-cosmos
// You can think of ExistingAddresses as a set of
// family agnostic "onchain pointers" meant to be used in conjunction
// with chain fields to read/write relevant chain state. Similarly,
// you can think of NodeIDs as "offchain pointers" to be used in
// conjunction with the Offchain client to read/write relevant
// offchain state (i.e. state in the DON(s)).
type Environment struct {
	Name              string
	Logger            logger.Logger
	ExistingAddresses AddressBook
	Chains            map[uint64]Chain
	SolChains         map[uint64]SolChain
	NodeIDs           []string
	Offchain          OffchainClient
	GetContext        func() context.Context
	OCRSecrets        OCRSecrets
}

func NewEnvironment(
	name string,
	logger logger.Logger,
	existingAddrs AddressBook,
	chains map[uint64]Chain,
	solChains map[uint64]SolChain,
	nodeIDs []string,
	offchain OffchainClient,
	ctx func() context.Context,
	secrets OCRSecrets,
) *Environment {
	return &Environment{
		Name:              name,
		Logger:            logger,
		ExistingAddresses: existingAddrs,
		Chains:            chains,
		SolChains:         solChains,
		NodeIDs:           nodeIDs,
		Offchain:          offchain,
		GetContext:        ctx,
		OCRSecrets:        secrets,
	}
}

func (e Environment) AllChainSelectors() []uint64 {
	var selectors []uint64
	for sel := range e.Chains {
		selectors = append(selectors, sel)
	}
	sort.Slice(selectors, func(i, j int) bool {
		return selectors[i] < selectors[j]
	})
	return selectors
}

func (e Environment) AllChainSelectorsExcluding(excluding []uint64) []uint64 {
	var selectors []uint64
	for sel := range e.Chains {
		excluded := false
		for _, toExclude := range excluding {
			if sel == toExclude {
				excluded = true
			}
		}
		if excluded {
			continue
		}
		selectors = append(selectors, sel)
	}
	sort.Slice(selectors, func(i, j int) bool {
		return selectors[i] < selectors[j]
	})
	return selectors
}

func (e Environment) AllChainSelectorsSolana() []uint64 {
	selectors := make([]uint64, 0, len(e.SolChains))
	for sel := range e.SolChains {
		selectors = append(selectors, sel)
	}
	sort.Slice(selectors, func(i, j int) bool {
		return selectors[i] < selectors[j]
	})
	return selectors
}

func (e Environment) AllDeployerKeys() []common.Address {
	var deployerKeys []common.Address
	for sel := range e.Chains {
		deployerKeys = append(deployerKeys, e.Chains[sel].DeployerKey.From)
	}
	return deployerKeys
}

func ConfirmIfNoError(chain Chain, tx *types.Transaction, err error) (uint64, error) {
	if err != nil {
		//revive:disable
		var d rpc.DataError
		ok := errors.As(err, &d)
		if ok {
			return 0, fmt.Errorf("transaction reverted on chain %s: Error %s ErrorData %v", chain.String(), d.Error(), d.ErrorData())
		}
		return 0, err
	}
	return chain.Confirm(tx)
}

func MaybeDataErr(err error) error {
	//revive:disable
	var d rpc.DataError
	ok := errors.As(err, &d)
	if ok {
		return fmt.Errorf("%s: %v", d.Error(), d.ErrorData())
	}
	return err
}

func DecodedErrFromABIIfDataErr(err error, abi string) error {
	var d rpc.DataError
	ok := errors.As(err, &d)
	if ok {
		errReason, err := parseErrorFromABI(fmt.Sprintf("%s", d.ErrorData()), abi)
		if err != nil {
			return fmt.Errorf("%s: %v", d.Error(), d.ErrorData())
		}
		return fmt.Errorf("%s due to %s: %v", d.Error(), errReason, d.ErrorData())
	}
	return err
}

func UBigInt(i uint64) *big.Int {
	return new(big.Int).SetUint64(i)
}

func E18Mult(amount uint64) *big.Int {
	return new(big.Int).Mul(UBigInt(amount), UBigInt(1e18))
}

type OCRConfig struct {
	OffchainPublicKey types2.OffchainPublicKey
	// For EVM-chains, this an *address*.
	OnchainPublicKey          types2.OnchainPublicKey
	PeerID                    p2pkey.PeerID
	TransmitAccount           types2.Account
	ConfigEncryptionPublicKey types3.ConfigEncryptionPublicKey
	KeyBundleID               string
}

// Nodes includes is a group CL nodes.
type Nodes []Node

// PeerIDs returns peerIDs in a sorted list
func (n Nodes) PeerIDs() [][32]byte {
	var peerIDs [][32]byte
	for _, node := range n {
		peerIDs = append(peerIDs, node.PeerID)
	}
	sort.Slice(peerIDs, func(i, j int) bool {
		return bytes.Compare(peerIDs[i][:], peerIDs[j][:]) < 0
	})
	return peerIDs
}

func (n Nodes) NonBootstraps() Nodes {
	var nonBootstraps Nodes
	for _, node := range n {
		if node.IsBootstrap {
			continue
		}
		nonBootstraps = append(nonBootstraps, node)
	}
	return nonBootstraps
}

func (n Nodes) DefaultF() uint8 {
	return uint8(len(n) / 3)
}

func (n Nodes) BootstrapLocators() []string {
	bootstrapMp := make(map[string]struct{})
	for _, node := range n {
		if node.IsBootstrap {
			bootstrapMp[fmt.Sprintf("%s@%s",
				// p2p_12D3... -> 12D3...
				node.PeerID.String()[4:], node.MultiAddr)] = struct{}{}
		}
	}
	var locators []string
	for b := range bootstrapMp {
		locators = append(locators, b)
	}
	return locators
}

type Node struct {
	NodeID         string
	Name           string
	CSAKey         string
	SelToOCRConfig map[chain_selectors.ChainDetails]OCRConfig
	PeerID         p2pkey.PeerID
	IsBootstrap    bool
	MultiAddr      string
	AdminAddr      string
	Labels         []*ptypes.Label
}

func (n Node) OCRConfigForChainDetails(details chain_selectors.ChainDetails) (OCRConfig, bool) {
	c, ok := n.SelToOCRConfig[details]
	return c, ok
}

func (n Node) OCRConfigForChainSelector(chainSel uint64) (OCRConfig, bool) {
	fam, err := chain_selectors.GetSelectorFamily(chainSel)
	if err != nil {
		return OCRConfig{}, false
	}

	id, err := chain_selectors.GetChainIDFromSelector(chainSel)
	if err != nil {
		return OCRConfig{}, false
	}

	want, err := chain_selectors.GetChainDetailsByChainIDAndFamily(id, fam)
	if err != nil {
		return OCRConfig{}, false
	}
	c, ok := n.SelToOCRConfig[want]
	return c, ok
}

func MustPeerIDFromString(s string) p2pkey.PeerID {
	p := p2pkey.PeerID{}
	if err := p.UnmarshalString(s); err != nil {
		panic(err)
	}
	return p
}

type NodeChainConfigsLister interface {
	ListNodes(ctx context.Context, in *nodev1.ListNodesRequest, opts ...grpc.CallOption) (*nodev1.ListNodesResponse, error)
	ListNodeChainConfigs(ctx context.Context, in *nodev1.ListNodeChainConfigsRequest, opts ...grpc.CallOption) (*nodev1.ListNodeChainConfigsResponse, error)
}

// Gathers all the node info through JD required to be able to set
// OCR config for example. nodeIDs can be JD IDs or PeerIDs
func NodeInfo(nodeIDs []string, oc NodeChainConfigsLister) (Nodes, error) {
	if len(nodeIDs) == 0 {
		return nil, nil
	}
	// if nodeIDs starts with `p2p_` lookup by p2p_id instead
	filterByPeerIDs := strings.HasPrefix(nodeIDs[0], "p2p_")
	var filter *nodev1.ListNodesRequest_Filter
	if filterByPeerIDs {
		selector := strings.Join(nodeIDs, ",")
		filter = &nodev1.ListNodesRequest_Filter{
			Enabled: 1,
			Selectors: []*ptypes.Selector{
				{
					Key:   "p2p_id",
					Op:    ptypes.SelectorOp_IN,
					Value: &selector,
				},
			},
		}
	} else {
		filter = &nodev1.ListNodesRequest_Filter{
			Enabled: 1,
			Ids:     nodeIDs,
		}
	}
	nodesFromJD, err := oc.ListNodes(context.Background(), &nodev1.ListNodesRequest{
		Filter: filter,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	var nodes []Node
	for _, node := range nodesFromJD.GetNodes() {
		// TODO: Filter should accept multiple nodes
		nodeChainConfigs, err := oc.ListNodeChainConfigs(context.Background(), &nodev1.ListNodeChainConfigsRequest{Filter: &nodev1.ListNodeChainConfigsRequest_Filter{
			NodeIds: []string{node.Id},
		}})
		if err != nil {
			return nil, err
		}
		selToOCRConfig := make(map[chain_selectors.ChainDetails]OCRConfig)
		bootstrap := false
		var peerID p2pkey.PeerID
		var multiAddr string
		var adminAddr string
		for _, chainConfig := range nodeChainConfigs.ChainConfigs {
			// NOTE: Assume same peerID/multiAddr for all chains.
			// Might make sense to change proto as peerID/multiAddr is 1-1 with nodeID?
			peerID = MustPeerIDFromString(chainConfig.Ocr2Config.P2PKeyBundle.PeerId)
			multiAddr = chainConfig.Ocr2Config.Multiaddr
			if chainConfig.Ocr2Config.IsBootstrap {
				// NOTE: Assume same peerID for all chains.
				// Might make sense to change proto as peerID is 1-1 with nodeID?
				bootstrap = true
				break
			}
			b := common.Hex2Bytes(chainConfig.Ocr2Config.OcrKeyBundle.OffchainPublicKey)
			var opk types2.OffchainPublicKey
			copy(opk[:], b)

			b = common.Hex2Bytes(chainConfig.Ocr2Config.OcrKeyBundle.ConfigPublicKey)
			var cpk types3.ConfigEncryptionPublicKey
			copy(cpk[:], b)

			var pubkey types3.OnchainPublicKey
			if chainConfig.Chain.Type == nodev1.ChainType_CHAIN_TYPE_EVM {
				// convert from pubkey to address
				pubkey = common.HexToAddress(chainConfig.Ocr2Config.OcrKeyBundle.OnchainSigningAddress).Bytes()
			} else {
				pubkey = common.Hex2Bytes(chainConfig.Ocr2Config.OcrKeyBundle.OnchainSigningAddress)
			}

			ocrConfig := OCRConfig{
				OffchainPublicKey:         opk,
				OnchainPublicKey:          pubkey,
				PeerID:                    MustPeerIDFromString(chainConfig.Ocr2Config.P2PKeyBundle.PeerId),
				TransmitAccount:           types2.Account(chainConfig.AccountAddress),
				ConfigEncryptionPublicKey: cpk,
				KeyBundleID:               chainConfig.Ocr2Config.OcrKeyBundle.BundleId,
			}

			if chainConfig.Chain.Type == nodev1.ChainType_CHAIN_TYPE_EVM {
				// NOTE: Assume same adminAddr for all chains. We always use EVM addr
				adminAddr = chainConfig.AdminAddress
			}

			var family string
			switch chainConfig.Chain.Type {
			case nodev1.ChainType_CHAIN_TYPE_EVM:
				family = chain_selectors.FamilyEVM
			case nodev1.ChainType_CHAIN_TYPE_APTOS:
				family = chain_selectors.FamilyAptos
			case nodev1.ChainType_CHAIN_TYPE_SOLANA:
				family = chain_selectors.FamilySolana
			case nodev1.ChainType_CHAIN_TYPE_STARKNET:
				family = chain_selectors.FamilyStarknet
			default:
				return nil, fmt.Errorf("unsupported chain type %s", chainConfig.Chain.Type)
			}

			details, err := chain_selectors.GetChainDetailsByChainIDAndFamily(chainConfig.Chain.Id, family)
			if err != nil {
				return nil, err
			}

			selToOCRConfig[details] = ocrConfig
		}
		nodes = append(nodes, Node{
			NodeID:         node.Id,
			Name:           node.Name,
			CSAKey:         node.PublicKey,
			SelToOCRConfig: selToOCRConfig,
			IsBootstrap:    bootstrap,
			PeerID:         peerID,
			MultiAddr:      multiAddr,
			AdminAddr:      adminAddr,
			Labels:         node.Labels,
		})
	}

	return nodes, nil
}

type CapabilityRegistryConfig struct {
	EVMChainID  uint64         // chain id of the chain the CR is deployed on
	Contract    common.Address // address of the CR contract
	NetworkType string         // network type of the chain
}
