package testhelpers

import (
	"context"
	"errors"
	"math/big"
	"os"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zapcore"

	"github.com/smartcontractkit/chainlink-common/pkg/logger"
	"github.com/smartcontractkit/chainlink-testing-framework/lib/utils/testcontext"

	"github.com/smartcontractkit/chainlink/deployment/ccip/changeset"

	"github.com/smartcontractkit/chainlink-ccip/chainconfig"
	cciptypes "github.com/smartcontractkit/chainlink-ccip/pkg/types/ccipocr3"
	"github.com/smartcontractkit/chainlink-ccip/pluginconfig"
	commonconfig "github.com/smartcontractkit/chainlink-common/pkg/config"

	"github.com/smartcontractkit/chainlink/deployment"
	"github.com/smartcontractkit/chainlink/deployment/ccip/changeset/globals"
	changeset_solana "github.com/smartcontractkit/chainlink/deployment/ccip/changeset/solana"
	commonchangeset "github.com/smartcontractkit/chainlink/deployment/common/changeset"
	"github.com/smartcontractkit/chainlink/deployment/common/proposalutils"
	commontypes "github.com/smartcontractkit/chainlink/deployment/common/types"
	"github.com/smartcontractkit/chainlink/deployment/environment/memory"
	"github.com/smartcontractkit/chainlink/v2/core/capabilities/ccip/types"
)

type EnvType string

const (
	Memory      EnvType = "in-memory"
	Docker      EnvType = "docker"
	ENVTESTTYPE         = "CCIP_V16_TEST_ENV"
)

type TestConfigs struct {
	Type      EnvType // set by env var CCIP_V16_TEST_ENV, defaults to Memory
	CreateJob bool
	// TODO: This should be CreateContracts so the booleans make sense?
	CreateJobAndContracts      bool
	PrerequisiteDeploymentOnly bool
	V1_5Cfg                    changeset.V1_5DeploymentConfig
	Chains                     int      // only used in memory mode, for docker mode, this is determined by the integration-test config toml input
	SolChains                  int      // only used in memory mode, for docker mode, this is determined by the integration-test config toml input
	ChainIDs                   []uint64 // only used in memory mode, for docker mode, this is determined by the integration-test config toml input
	NumOfUsersPerChain         int      // only used in memory mode, for docker mode, this is determined by the integration-test config toml input
	Nodes                      int      // only used in memory mode, for docker mode, this is determined by the integration-test config toml input
	Bootstraps                 int      // only used in memory mode, for docker mode, this is determined by the integration-test config toml input
	IsUSDC                     bool
	IsUSDCAttestationMissing   bool
	IsMultiCall3               bool
	IsStaticLink               bool
	OCRConfigOverride          func(*changeset.CCIPOCRParams)
	RMNEnabled                 bool
	NumOfRMNNodes              int
	LinkPrice                  *big.Int
	WethPrice                  *big.Int
	BlockTime                  time.Duration
}

func (tc *TestConfigs) Validate() error {
	if tc.Chains < 2 {
		return errors.New("chains must be at least 2")
	}
	if tc.Nodes < 4 {
		return errors.New("nodes must be at least 4")
	}
	if tc.Bootstraps < 1 {
		return errors.New("bootstraps must be at least 1")
	}
	if tc.Type == Memory && tc.RMNEnabled {
		return errors.New("cannot run RMN tests in memory mode")
	}
	return nil
}

func (tc *TestConfigs) MustSetEnvTypeOrDefault(t *testing.T) {
	envType := os.Getenv(ENVTESTTYPE)
	if envType == "" || envType == string(Memory) {
		tc.Type = Memory
	} else if envType == string(Docker) {
		tc.Type = Docker
	} else {
		t.Fatalf("env var CCIP_V16_TEST_ENV must be either %s or %s, defaults to %s if unset, got: %s", Memory, Docker, Memory, envType)
	}
}

func DefaultTestConfigs() *TestConfigs {
	return &TestConfigs{
		Chains:                2,
		NumOfUsersPerChain:    1,
		Nodes:                 4,
		Bootstraps:            1,
		LinkPrice:             changeset.MockLinkPrice,
		WethPrice:             changeset.MockWethPrice,
		CreateJobAndContracts: true,
		BlockTime:             2 * time.Second,
	}
}

type TestOps func(testCfg *TestConfigs)

func WithBlockTime(blockTime time.Duration) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.BlockTime = blockTime
	}
}

func WithMultiCall3() TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.IsMultiCall3 = true
	}
}

func WithStaticLink() TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.IsStaticLink = true
	}
}

func WithPrerequisiteDeploymentOnly(v1_5Cfg *changeset.V1_5DeploymentConfig) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.PrerequisiteDeploymentOnly = true
		if v1_5Cfg != nil {
			testCfg.V1_5Cfg = *v1_5Cfg
		}
	}
}

func WithChainIDs(chainIDs []uint64) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.ChainIDs = chainIDs
	}
}

func WithJobsOnly() TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.CreateJobAndContracts = false
		testCfg.CreateJob = true
	}
}

func WithNoJobsAndContracts() TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.CreateJobAndContracts = false
		testCfg.CreateJob = false
	}
}

func WithRMNEnabled(numOfNode int) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.RMNEnabled = true
		testCfg.NumOfRMNNodes = numOfNode
	}
}

func WithOCRConfigOverride(override func(*changeset.CCIPOCRParams)) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.OCRConfigOverride = override
	}
}

func WithUSDCAttestationMissing() TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.IsUSDCAttestationMissing = true
	}
}

func WithUSDC() TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.IsUSDC = true
	}
}

func WithNumOfChains(numChains int) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.Chains = numChains
	}
}

func WithSolChains(numChains int) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.SolChains = numChains
	}
}

func WithNumOfUsersPerChain(numUsers int) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.NumOfUsersPerChain = numUsers
	}
}

func WithNumOfNodes(numNodes int) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.Nodes = numNodes
	}
}

func WithNumOfBootstrapNodes(numBootstraps int) TestOps {
	return func(testCfg *TestConfigs) {
		testCfg.Bootstraps = numBootstraps
	}
}

type TestEnvironment interface {
	SetupJobs(t *testing.T)
	StartNodes(t *testing.T, crConfig deployment.CapabilityRegistryConfig)
	StartChains(t *testing.T)
	TestConfigs() *TestConfigs
	DeployedEnvironment() DeployedEnv
	UpdateDeployedEnvironment(env DeployedEnv)
	MockUSDCAttestationServer(t *testing.T, isUSDCAttestationMissing bool) string
}

type DeployedEnv struct {
	Env          deployment.Environment
	HomeChainSel uint64
	FeedChainSel uint64
	ReplayBlocks map[uint64]uint64
	Users        map[uint64][]*bind.TransactOpts
}

func (d *DeployedEnv) TimelockContracts(t *testing.T) map[uint64]*proposalutils.TimelockExecutionContracts {
	timelocks := make(map[uint64]*proposalutils.TimelockExecutionContracts)
	state, err := changeset.LoadOnchainState(d.Env)
	require.NoError(t, err)
	for chain, chainState := range state.Chains {
		timelocks[chain] = &proposalutils.TimelockExecutionContracts{
			Timelock:  chainState.Timelock,
			CallProxy: chainState.CallProxy,
		}
	}
	return timelocks
}

func (d *DeployedEnv) SetupJobs(t *testing.T) {
	out, err := changeset.CCIPCapabilityJobspecChangeset(d.Env, struct{}{})
	require.NoError(t, err)
	require.NotEmpty(t, out.Jobs)
	for _, job := range out.Jobs {
		require.NotEmpty(t, job.JobID)
		require.NotEmpty(t, job.Spec)
		require.NotEmpty(t, job.Node)
	}
	// Wait for plugins to register filters?
	// TODO: Investigate how to avoid.
	time.Sleep(30 * time.Second)
	ReplayLogs(t, d.Env.Offchain, d.ReplayBlocks)
}

type MemoryEnvironment struct {
	DeployedEnv
	TestConfig *TestConfigs
	Chains     map[uint64]deployment.Chain
	SolChains  map[uint64]deployment.SolChain
}

func (m *MemoryEnvironment) TestConfigs() *TestConfigs {
	return m.TestConfig
}

func (m *MemoryEnvironment) DeployedEnvironment() DeployedEnv {
	return m.DeployedEnv
}

func (m *MemoryEnvironment) UpdateDeployedEnvironment(env DeployedEnv) {
	m.DeployedEnv = env
}

func (m *MemoryEnvironment) StartChains(t *testing.T) {
	ctx := testcontext.Get(t)
	tc := m.TestConfig
	var chains map[uint64]deployment.Chain
	var users map[uint64][]*bind.TransactOpts
	if len(tc.ChainIDs) > 0 {
		chains, users = memory.NewMemoryChainsWithChainIDs(t, tc.ChainIDs, tc.NumOfUsersPerChain)
		if tc.Chains > len(tc.ChainIDs) {
			additionalChains, additionalUsers := memory.NewMemoryChains(t, tc.Chains-len(tc.ChainIDs), tc.NumOfUsersPerChain)
			for k, v := range additionalChains {
				chains[k] = v
			}
			for k, v := range additionalUsers {
				users[k] = v
			}
		}
	} else {
		chains, users = memory.NewMemoryChains(t, tc.Chains, tc.NumOfUsersPerChain)
	}

	m.Chains = chains
	m.SolChains = memory.NewMemoryChainsSol(t, tc.SolChains)
	homeChainSel, feedSel := allocateCCIPChainSelectors(chains)
	replayBlocks, err := LatestBlocksByChain(ctx, chains)
	require.NoError(t, err)
	m.DeployedEnv = DeployedEnv{
		Env: deployment.Environment{
			Chains:    m.Chains,
			SolChains: m.SolChains,
		},
		HomeChainSel: homeChainSel,
		FeedChainSel: feedSel,
		ReplayBlocks: replayBlocks,
		Users:        users,
	}
}

func (m *MemoryEnvironment) StartNodes(t *testing.T, crConfig deployment.CapabilityRegistryConfig) {
	require.NotNil(t, m.Chains, "start chains first, chains are empty")
	require.NotNil(t, m.DeployedEnv, "start chains and initiate deployed env first before starting nodes")
	tc := m.TestConfig
	nodes := memory.NewNodes(t, zapcore.InfoLevel, m.Chains, m.SolChains, tc.Nodes, tc.Bootstraps, crConfig)
	ctx := testcontext.Get(t)
	lggr := logger.Test(t)
	for _, node := range nodes {
		require.NoError(t, node.App.Start(ctx))
		t.Cleanup(func() {
			require.NoError(t, node.App.Stop())
		})
	}
	m.DeployedEnv.Env = memory.NewMemoryEnvironmentFromChainsNodes(func() context.Context { return ctx }, lggr, m.Chains, m.SolChains, nodes)
}

func (m *MemoryEnvironment) MockUSDCAttestationServer(t *testing.T, isUSDCAttestationMissing bool) string {
	server := mockAttestationResponse(isUSDCAttestationMissing)
	endpoint := server.URL
	t.Cleanup(func() {
		server.Close()
	})
	return endpoint
}

// mineBlocks forces the simulated backend to produce a new block every X seconds
// NOTE: based on implementation in cltest/simulated_backend.go
func mineBlocks(backend *memory.Backend, blockTime time.Duration) (stopMining func()) {
	timer := time.NewTicker(blockTime)
	chStop := make(chan struct{})
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			select {
			case <-timer.C:
				backend.Commit()
			case <-chStop:
				return
			}
		}
	}()
	return func() {
		close(chStop)
		timer.Stop()
		<-done
	}
}

func (m *MemoryEnvironment) MineBlocks(t *testing.T, blockTime time.Duration) {
	for _, chain := range m.Chains {
		if backend, ok := chain.Client.(*memory.Backend); ok {
			stopMining := mineBlocks(backend, blockTime)
			t.Cleanup(stopMining)
		}
	}
}

// NewMemoryEnvironment creates an in-memory environment based on the testconfig requested
func NewMemoryEnvironment(t *testing.T, opts ...TestOps) (DeployedEnv, TestEnvironment) {
	testCfg := DefaultTestConfigs()
	for _, opt := range opts {
		opt(testCfg)
	}
	require.NoError(t, testCfg.Validate(), "invalid test config")
	env := &MemoryEnvironment{
		TestConfig: testCfg,
	}
	var dEnv DeployedEnv
	switch {
	case testCfg.PrerequisiteDeploymentOnly:
		dEnv = NewEnvironmentWithPrerequisitesContracts(t, env)
	case testCfg.CreateJobAndContracts:
		dEnv = NewEnvironmentWithJobsAndContracts(t, env)
	case testCfg.CreateJob:
		dEnv = NewEnvironmentWithJobs(t, env)
	default:
		dEnv = NewEnvironment(t, env)
	}
	env.UpdateDeployedEnvironment(dEnv)
	if testCfg.BlockTime > 0 {
		env.MineBlocks(t, testCfg.BlockTime)
	}
	return dEnv, env
}

func NewEnvironmentWithPrerequisitesContracts(t *testing.T, tEnv TestEnvironment) DeployedEnv {
	var err error
	tc := tEnv.TestConfigs()
	e := NewEnvironment(t, tEnv)
	evmChains := e.Env.AllChainSelectors()
	solChains := e.Env.AllChainSelectorsSolana()
	//nolint:gocritic // we need to segregate EVM and Solana chains
	allChains := append(evmChains, solChains...)
	if len(solChains) > 0 {
		SavePreloadedSolAddresses(t, e.Env, solChains[0])
	}
	mcmsCfg := make(map[uint64]commontypes.MCMSWithTimelockConfig)
	for _, c := range e.Env.AllChainSelectors() {
		mcmsCfg[c] = proposalutils.SingleGroupTimelockConfig(t)
	}
	prereqCfg := make([]changeset.DeployPrerequisiteConfigPerChain, 0)
	for _, chain := range evmChains {
		var opts []changeset.PrerequisiteOpt
		if tc != nil {
			if tc.IsUSDC {
				opts = append(opts, changeset.WithUSDCEnabled())
			}
			if tc.IsMultiCall3 {
				opts = append(opts, changeset.WithMultiCall3Enabled())
			}
		}
		if tc.V1_5Cfg != (changeset.V1_5DeploymentConfig{}) {
			opts = append(opts, changeset.WithLegacyDeploymentEnabled(tc.V1_5Cfg))
		}
		prereqCfg = append(prereqCfg, changeset.DeployPrerequisiteConfigPerChain{
			ChainSelector: chain,
			Opts:          opts,
		})
	}
	deployLinkApp := commonchangeset.ChangesetApplication{
		Changeset: commonchangeset.WrapChangeSet(commonchangeset.DeployLinkToken),
		Config:    allChains,
	}
	if tc.IsStaticLink {
		deployLinkApp = commonchangeset.ChangesetApplication{
			Changeset: commonchangeset.WrapChangeSet(commonchangeset.DeployStaticLinkToken),
			Config:    allChains,
		}
	}
	e.Env, err = commonchangeset.ApplyChangesets(t, e.Env, nil, []commonchangeset.ChangesetApplication{
		deployLinkApp,
		{
			Changeset: commonchangeset.WrapChangeSet(changeset.DeployPrerequisitesChangeset),
			Config: changeset.DeployPrerequisiteConfig{
				Configs: prereqCfg,
			},
		},
		{
			Changeset: commonchangeset.WrapChangeSet(commonchangeset.DeployMCMSWithTimelock),
			Config:    mcmsCfg,
		},
	})
	require.NoError(t, err)
	tEnv.UpdateDeployedEnvironment(e)
	return e
}

func NewEnvironment(t *testing.T, tEnv TestEnvironment) DeployedEnv {
	lggr := logger.Test(t)
	tc := tEnv.TestConfigs()
	tEnv.StartChains(t)
	dEnv := tEnv.DeployedEnvironment()
	require.NotEmpty(t, dEnv.FeedChainSel)
	require.NotEmpty(t, dEnv.HomeChainSel)
	require.NotEmpty(t, dEnv.Env.Chains)
	ab := deployment.NewMemoryAddressBook()
	crConfig := DeployTestContracts(t, lggr, ab, dEnv.HomeChainSel, dEnv.FeedChainSel, dEnv.Env.Chains, tc.LinkPrice, tc.WethPrice)
	tEnv.StartNodes(t, crConfig)
	dEnv = tEnv.DeployedEnvironment()
	dEnv.Env.ExistingAddresses = ab
	return dEnv
}

func NewEnvironmentWithJobsAndContracts(t *testing.T, tEnv TestEnvironment) DeployedEnv {
	var err error
	e := NewEnvironmentWithPrerequisitesContracts(t, tEnv)
	evmChains := e.Env.AllChainSelectors()
	solChains := e.Env.AllChainSelectorsSolana()
	//nolint:gocritic // we need to segregate EVM and Solana chains
	allChains := append(evmChains, solChains...)
	mcmsCfg := make(map[uint64]commontypes.MCMSWithTimelockConfig)

	for _, c := range e.Env.AllChainSelectors() {
		mcmsCfg[c] = proposalutils.SingleGroupTimelockConfig(t)
	}

	tEnv.UpdateDeployedEnvironment(e)

	e = AddCCIPContractsToEnvironment(t, allChains, tEnv, false)
	// now we update RMNProxy to point to RMNRemote
	e.Env, err = commonchangeset.ApplyChangesets(t, e.Env, nil, []commonchangeset.ChangesetApplication{
		{
			Changeset: commonchangeset.WrapChangeSet(changeset.SetRMNRemoteOnRMNProxyChangeset),
			Config: changeset.SetRMNRemoteOnRMNProxyConfig{
				ChainSelectors: evmChains,
			},
		},
	})
	require.NoError(t, err)
	return e
}

func AddCCIPContractsToEnvironment(t *testing.T, allChains []uint64, tEnv TestEnvironment, mcmsEnabled bool) DeployedEnv {
	tc := tEnv.TestConfigs()
	e := tEnv.DeployedEnvironment()
	envNodes, err := deployment.NodeInfo(e.Env.NodeIDs, e.Env.Offchain)
	require.NoError(t, err)

	// Need to deploy prerequisites first so that we can form the USDC config
	// no proposals to be made, timelock can be passed as nil here
	var apps []commonchangeset.ChangesetApplication
	allContractParams := make(map[uint64]changeset.ChainContractParams)

	for _, chain := range allChains {
		allContractParams[chain] = changeset.ChainContractParams{
			FeeQuoterParams: changeset.DefaultFeeQuoterParams(),
			OffRampParams:   changeset.DefaultOffRampParams(),
		}
	}

	evmChains := []uint64{}
	for _, chain := range allChains {
		if _, ok := e.Env.Chains[chain]; ok {
			evmChains = append(evmChains, chain)
		}
	}

	solChains := []uint64{}
	for _, chain := range allChains {
		if _, ok := e.Env.SolChains[chain]; ok {
			solChains = append(solChains, chain)
		}
	}

	apps = append(apps, []commonchangeset.ChangesetApplication{
		{
			Changeset: commonchangeset.WrapChangeSet(changeset.DeployHomeChainChangeset),
			Config: changeset.DeployHomeChainConfig{
				HomeChainSel:     e.HomeChainSel,
				RMNDynamicConfig: NewTestRMNDynamicConfig(),
				RMNStaticConfig:  NewTestRMNStaticConfig(),
				NodeOperators:    NewTestNodeOperator(e.Env.Chains[e.HomeChainSel].DeployerKey.From),
				NodeP2PIDsPerNodeOpAdmin: map[string][][32]byte{
					TestNodeOperator: envNodes.NonBootstraps().PeerIDs(),
				},
			},
		},
		{
			Changeset: commonchangeset.WrapChangeSet(changeset.DeployChainContractsChangeset),
			Config: changeset.DeployChainContractsConfig{
				HomeChainSelector:      e.HomeChainSel,
				ContractParamsPerChain: allContractParams,
			},
		},
	}...)
	e.Env, err = commonchangeset.ApplyChangesets(t, e.Env, nil, apps)
	require.NoError(t, err)

	state, err := changeset.LoadOnchainState(e.Env)
	require.NoError(t, err)
	// Assert link present
	if tc.IsStaticLink {
		require.NotNil(t, state.Chains[e.FeedChainSel].StaticLinkToken)
	} else {
		require.NotNil(t, state.Chains[e.FeedChainSel].LinkToken)
	}
	require.NotNil(t, state.Chains[e.FeedChainSel].Weth9)

	tokenConfig := changeset.NewTestTokenConfig(state.Chains[e.FeedChainSel].USDFeeds)
	var tokenDataProviders []pluginconfig.TokenDataObserverConfig
	if tc.IsUSDC {
		endpoint := tEnv.MockUSDCAttestationServer(t, tc.IsUSDCAttestationMissing)
		cctpContracts := make(map[cciptypes.ChainSelector]pluginconfig.USDCCCTPTokenConfig)
		for _, usdcChain := range evmChains {
			require.NotNil(t, state.Chains[usdcChain].MockUSDCTokenMessenger)
			require.NotNil(t, state.Chains[usdcChain].MockUSDCTransmitter)
			require.NotNil(t, state.Chains[usdcChain].USDCTokenPool)
			cctpContracts[cciptypes.ChainSelector(usdcChain)] = pluginconfig.USDCCCTPTokenConfig{
				SourcePoolAddress:            state.Chains[usdcChain].USDCTokenPool.Address().String(),
				SourceMessageTransmitterAddr: state.Chains[usdcChain].MockUSDCTransmitter.Address().String(),
			}
		}
		tokenDataProviders = append(tokenDataProviders, pluginconfig.TokenDataObserverConfig{
			Type:    pluginconfig.USDCCCTPHandlerType,
			Version: "1.0",
			USDCCCTPObserverConfig: &pluginconfig.USDCCCTPObserverConfig{
				Tokens:                 cctpContracts,
				AttestationAPI:         endpoint,
				AttestationAPITimeout:  commonconfig.MustNewDuration(time.Second),
				AttestationAPIInterval: commonconfig.MustNewDuration(500 * time.Millisecond),
			}})
	}

	timelockContractsPerChain := make(map[uint64]*proposalutils.TimelockExecutionContracts)
	timelockContractsPerChain[e.HomeChainSel] = &proposalutils.TimelockExecutionContracts{
		Timelock:  state.Chains[e.HomeChainSel].Timelock,
		CallProxy: state.Chains[e.HomeChainSel].CallProxy,
	}
	nodeInfo, err := deployment.NodeInfo(e.Env.NodeIDs, e.Env.Offchain)
	require.NoError(t, err)
	// Build the per chain config.
	chainConfigs := make(map[uint64]changeset.ChainConfig)
	ocrConfigs := make(map[uint64]changeset.CCIPOCRParams)
	for _, chain := range evmChains {
		timelockContractsPerChain[chain] = &proposalutils.TimelockExecutionContracts{
			Timelock:  state.Chains[chain].Timelock,
			CallProxy: state.Chains[chain].CallProxy,
		}
		var linkTokenAddr common.Address
		if tc.IsStaticLink {
			linkTokenAddr = state.Chains[chain].StaticLinkToken.Address()
		} else {
			linkTokenAddr = state.Chains[chain].LinkToken.Address()
		}
		tokenInfo := tokenConfig.GetTokenInfo(e.Env.Logger, linkTokenAddr, state.Chains[chain].Weth9.Address())
		ocrOverride := tc.OCRConfigOverride
		if tc.RMNEnabled {
			ocrOverride = func(ocrParams *changeset.CCIPOCRParams) {
				if tc.OCRConfigOverride != nil {
					tc.OCRConfigOverride(ocrParams)
				}
				ocrParams.CommitOffChainConfig.RMNEnabled = true
			}
		}
		ocrParams := changeset.DeriveCCIPOCRParams(
			changeset.WithDefaultCommitOffChainConfig(e.FeedChainSel, tokenInfo),
			changeset.WithDefaultExecuteOffChainConfig(tokenDataProviders),
			changeset.WithOCRParamOverride(ocrOverride),
		)
		ocrConfigs[chain] = ocrParams
		chainConfigs[chain] = changeset.ChainConfig{
			Readers: nodeInfo.NonBootstraps().PeerIDs(),
			FChain:  uint8(len(nodeInfo.NonBootstraps().PeerIDs()) / 3),
			EncodableChainConfig: chainconfig.ChainConfig{
				GasPriceDeviationPPB:    cciptypes.BigInt{Int: big.NewInt(globals.GasPriceDeviationPPB)},
				DAGasPriceDeviationPPB:  cciptypes.BigInt{Int: big.NewInt(globals.DAGasPriceDeviationPPB)},
				OptimisticConfirmations: globals.OptimisticConfirmations,
			},
		}
	}

	for _, chain := range solChains {
		ocrOverride := tc.OCRConfigOverride
		ocrParams := changeset.DeriveCCIPOCRParams(
			// TODO: tokenInfo is nil for solana
			changeset.WithDefaultCommitOffChainConfig(e.FeedChainSel, nil),
			changeset.WithDefaultExecuteOffChainConfig(tokenDataProviders),
			changeset.WithOCRParamOverride(ocrOverride),
		)
		ocrConfigs[chain] = ocrParams
		chainConfigs[chain] = changeset.ChainConfig{
			Readers: nodeInfo.NonBootstraps().PeerIDs(),
			// #nosec G115 - Overflow is not a concern in this test scenario
			FChain: uint8(len(nodeInfo.NonBootstraps().PeerIDs()) / 3),
			EncodableChainConfig: chainconfig.ChainConfig{
				GasPriceDeviationPPB:    cciptypes.BigInt{Int: big.NewInt(globals.GasPriceDeviationPPB)},
				DAGasPriceDeviationPPB:  cciptypes.BigInt{Int: big.NewInt(globals.DAGasPriceDeviationPPB)},
				OptimisticConfirmations: globals.OptimisticConfirmations,
			},
		}
	}

	// Apply second set of changesets to configure the CCIP contracts.
	var mcmsConfig *changeset.MCMSConfig
	if mcmsEnabled {
		mcmsConfig = &changeset.MCMSConfig{
			MinDelay: 0,
		}
	}
	apps = []commonchangeset.ChangesetApplication{
		{
			// Add the chain configs for the new chains.
			Changeset: commonchangeset.WrapChangeSet(changeset.UpdateChainConfigChangeset),
			Config: changeset.UpdateChainConfigConfig{
				HomeChainSelector: e.HomeChainSel,
				RemoteChainAdds:   chainConfigs,
				MCMS:              mcmsConfig,
			},
		},
		{
			// Add the DONs and candidate commit OCR instances for the chain.
			Changeset: commonchangeset.WrapChangeSet(changeset.AddDonAndSetCandidateChangeset),
			Config: changeset.AddDonAndSetCandidateChangesetConfig{
				SetCandidateConfigBase: changeset.SetCandidateConfigBase{
					HomeChainSelector: e.HomeChainSel,
					// TODO: we dont know what this means for solana
					FeedChainSelector: e.FeedChainSel,
					MCMS:              mcmsConfig,
				},
				PluginInfo: changeset.SetCandidatePluginInfo{
					OCRConfigPerRemoteChainSelector: ocrConfigs,
					PluginType:                      types.PluginTypeCCIPCommit,
				},
			},
		},
		{
			// Add the exec OCR instances for the new chains.
			Changeset: commonchangeset.WrapChangeSet(changeset.SetCandidateChangeset),
			Config: changeset.SetCandidateChangesetConfig{
				SetCandidateConfigBase: changeset.SetCandidateConfigBase{
					HomeChainSelector: e.HomeChainSel,
					// TODO: we dont know what this means for solana
					FeedChainSelector: e.FeedChainSel,
					MCMS:              mcmsConfig,
				},
				PluginInfo: []changeset.SetCandidatePluginInfo{
					{
						OCRConfigPerRemoteChainSelector: ocrConfigs,
						PluginType:                      types.PluginTypeCCIPExec,
					},
				},
			},
		},
		{
			// Promote everything
			Changeset: commonchangeset.WrapChangeSet(changeset.PromoteCandidateChangeset),
			Config: changeset.PromoteCandidateChangesetConfig{
				HomeChainSelector: e.HomeChainSel,
				PluginInfo: []changeset.PromoteCandidatePluginInfo{
					{
						PluginType:           types.PluginTypeCCIPCommit,
						RemoteChainSelectors: allChains,
					},
					{
						PluginType:           types.PluginTypeCCIPExec,
						RemoteChainSelectors: allChains,
					},
				},
				MCMS: mcmsConfig,
			},
		},
		{
			// Enable the OCR config on the remote chains.
			Changeset: commonchangeset.WrapChangeSet(changeset.SetOCR3OffRampChangeset),
			Config: changeset.SetOCR3OffRampConfig{
				HomeChainSel:       e.HomeChainSel,
				RemoteChainSels:    evmChains,
				CCIPHomeConfigType: globals.ConfigTypeActive,
			},
		},
		{
			// Enable the OCR config on the remote chains.
			Changeset: commonchangeset.WrapChangeSet(changeset_solana.SetOCR3ConfigSolana),
			Config: changeset.SetOCR3OffRampConfig{
				HomeChainSel:       e.HomeChainSel,
				RemoteChainSels:    solChains,
				CCIPHomeConfigType: globals.ConfigTypeActive,
			},
		},
		{
			Changeset: commonchangeset.WrapChangeSet(changeset.CCIPCapabilityJobspecChangeset),
		},
	}
	e.Env, err = commonchangeset.ApplyChangesets(t, e.Env, timelockContractsPerChain, apps)
	require.NoError(t, err)

	ReplayLogs(t, e.Env.Offchain, e.ReplayBlocks)

	state, err = changeset.LoadOnchainState(e.Env)
	require.NoError(t, err)
	require.NotNil(t, state.Chains[e.HomeChainSel].CapabilityRegistry)
	require.NotNil(t, state.Chains[e.HomeChainSel].CCIPHome)
	require.NotNil(t, state.Chains[e.HomeChainSel].RMNHome)
	for _, chain := range evmChains {
		if tc.IsStaticLink {
			require.NotNil(t, state.Chains[chain].StaticLinkToken)
		} else {
			require.NotNil(t, state.Chains[chain].LinkToken)
		}
		require.NotNil(t, state.Chains[chain].Weth9)
		require.NotNil(t, state.Chains[chain].TokenAdminRegistry)
		require.NotNil(t, state.Chains[chain].RegistryModule)
		require.NotNil(t, state.Chains[chain].Router)
		require.NotNil(t, state.Chains[chain].RMNRemote)
		require.NotNil(t, state.Chains[chain].TestRouter)
		require.NotNil(t, state.Chains[chain].NonceManager)
		require.NotNil(t, state.Chains[chain].FeeQuoter)
		require.NotNil(t, state.Chains[chain].OffRamp)
		require.NotNil(t, state.Chains[chain].OnRamp)
	}
	ValidateSolanaState(t, e.Env, solChains)
	tEnv.UpdateDeployedEnvironment(e)
	return e
}

// NewEnvironmentWithJobs creates a new CCIP environment
// with capreg, fee tokens, feeds, nodes and jobs set up.
func NewEnvironmentWithJobs(t *testing.T, tEnv TestEnvironment) DeployedEnv {
	e := NewEnvironment(t, tEnv)
	e.SetupJobs(t)
	return e
}
