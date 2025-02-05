package cmd_test

import (
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	coscfg "github.com/smartcontractkit/chainlink-cosmos/pkg/cosmos/config"
	solcfg "github.com/smartcontractkit/chainlink-solana/pkg/solana/config"

	"github.com/smartcontractkit/chainlink/v2/core/cmd"
	"github.com/smartcontractkit/chainlink/v2/core/internal/cltest"
	"github.com/smartcontractkit/chainlink/v2/core/internal/testutils"
	"github.com/smartcontractkit/chainlink/v2/core/internal/testutils/cosmostest"
	"github.com/smartcontractkit/chainlink/v2/core/internal/testutils/solanatest"
	"github.com/smartcontractkit/chainlink/v2/core/services/chainlink"
	client2 "github.com/smartcontractkit/chainlink/v2/evm/client"
	"github.com/smartcontractkit/chainlink/v2/evm/utils/big"
)

func TestShell_IndexCosmosChains(t *testing.T) {
	t.Parallel()

	chainID := cosmostest.RandomChainID()
	chain := coscfg.TOMLConfig{
		ChainID: ptr(chainID),
		Enabled: ptr(true),
	}
	app := cosmosStartNewApplication(t, &chain)
	client, r := app.NewShellAndRenderer()

	require.NoError(t, cmd.NewChainClient(client, "cosmos").IndexChains(cltest.EmptyCLIContext()))
	chains := *r.Renders[0].(*cmd.ChainPresenters)
	require.Len(t, chains, 1)
	c := chains[0]
	assert.Equal(t, chainID, c.ID)
	assertTableRenders(t, r)
}

func newRandChainID() *big.Big {
	return big.New(testutils.NewRandomEVMChainID())
}

func TestShell_IndexEVMChains(t *testing.T) {
	t.Parallel()

	app := startNewApplicationV2(t, func(c *chainlink.Config, s *chainlink.Secrets) {
		c.EVM[0].Enabled = ptr(true)
		c.EVM[0].NonceAutoSync = ptr(false)
		c.EVM[0].BalanceMonitor.Enabled = ptr(false)
	})
	client, r := app.NewShellAndRenderer()

	require.NoError(t, cmd.NewChainClient(client, "evm").IndexChains(cltest.EmptyCLIContext()))
	chains := *r.Renders[0].(*cmd.ChainPresenters)
	require.Len(t, chains, 1)
	c := chains[0]
	assert.Equal(t, strconv.Itoa(client2.NullClientChainID), c.ID)
	assertTableRenders(t, r)
}

func TestShell_IndexSolanaChains(t *testing.T) {
	t.Parallel()

	id := solanatest.RandomChainID()
	cfg := solcfg.TOMLConfig{
		ChainID: &id,
		Enabled: ptr(true),
	}
	app := solanaStartNewApplication(t, &cfg)
	client, r := app.NewShellAndRenderer()

	require.NoError(t, cmd.NewChainClient(client, "solana").IndexChains(cltest.EmptyCLIContext()))
	chains := *r.Renders[0].(*cmd.ChainPresenters)
	require.Len(t, chains, 1)
	c := chains[0]
	assert.Equal(t, id, c.ID)
	assertTableRenders(t, r)
}
