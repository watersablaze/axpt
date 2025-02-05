package internal_test

import (
	"encoding/json"
	"testing"

	chainsel "github.com/smartcontractkit/chain-selectors"
	"github.com/stretchr/testify/require"

	"github.com/smartcontractkit/chainlink/deployment"
	"github.com/smartcontractkit/chainlink/deployment/common/changeset"
	"github.com/smartcontractkit/chainlink/deployment/common/changeset/internal"
	"github.com/smartcontractkit/chainlink/deployment/common/proposalutils"
	"github.com/smartcontractkit/chainlink/deployment/common/types"
	"github.com/smartcontractkit/chainlink/deployment/environment/memory"
	"github.com/smartcontractkit/chainlink/v2/core/logger"
)

func TestDeployMCMSWithConfig(t *testing.T) {
	lggr := logger.TestLogger(t)

	chains, _ := memory.NewMemoryChainsWithChainIDs(t, []uint64{
		chainsel.TEST_90000001.EvmChainID,
	}, 1)
	ab := deployment.NewMemoryAddressBook()

	// 1) Test WITHOUT a label
	mcmNoLabel, err := internal.DeployMCMSWithConfig(
		types.ProposerManyChainMultisig,
		lggr,
		chains[chainsel.TEST_90000001.Selector],
		ab,
		proposalutils.SingleGroupMCMS(t),
	)
	require.NoError(t, err)
	require.Empty(t, mcmNoLabel.Tv.Labels, "expected no label to be set")

	// 2) Test WITH a label
	label := "SA"
	mcmWithLabel, err := internal.DeployMCMSWithConfig(
		types.ProposerManyChainMultisig,
		lggr,
		chains[chainsel.TEST_90000001.Selector],
		ab,
		proposalutils.SingleGroupMCMS(t),
		internal.WithLabel(label),
	)
	require.NoError(t, err)
	require.NotNil(t, mcmWithLabel.Tv.Labels, "expected labels to be set")
	require.Contains(t, mcmWithLabel.Tv.Labels, label, "label mismatch")
}

func TestDeployMCMSWithTimelockContracts(t *testing.T) {
	lggr := logger.TestLogger(t)
	chains, _ := memory.NewMemoryChainsWithChainIDs(t, []uint64{
		chainsel.TEST_90000001.EvmChainID,
	}, 1)
	ab := deployment.NewMemoryAddressBook()
	_, err := internal.DeployMCMSWithTimelockContracts(lggr,
		chains[chainsel.TEST_90000001.Selector],
		ab, proposalutils.SingleGroupTimelockConfig(t))
	require.NoError(t, err)
	addresses, err := ab.AddressesForChain(chainsel.TEST_90000001.Selector)
	require.NoError(t, err)
	require.Len(t, addresses, 5)
	mcmsState, err := changeset.MaybeLoadMCMSWithTimelockChainState(chains[chainsel.TEST_90000001.Selector], addresses)
	require.NoError(t, err)
	v, err := mcmsState.GenerateMCMSWithTimelockView()
	b, err := json.MarshalIndent(v, "", "  ")
	require.NoError(t, err)
	t.Log(string(b))
}
