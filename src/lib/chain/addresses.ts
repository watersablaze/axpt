export const addresses = {
  token: process.env.PROTIUM_TOKEN_ADDRESS || '',
  // reserved for future expansion:
  auction: process.env.HYDROGEN_AUCTION_ADDRESS || '',
  escrow: process.env.ESCROW_SETTLEMENT_ADDRESS || ''
};

export function requireAddress(label: keyof typeof addresses): string {
  const addr = addresses[label];
  if (!addr) throw new Error(`Missing address for ${label}. Set ${label.toUpperCase()}_ADDRESS`);
  return addr;
}