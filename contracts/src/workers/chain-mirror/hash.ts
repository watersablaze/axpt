import { ethers } from 'ethers';

/** keccak256(utf8) -> bytes32 */
export function k32(text: string): `0x${string}` {
  return ethers.keccak256(ethers.toUtf8Bytes(text)) as `0x${string}`;
}

/** normalize to bytes32 hex string */
export function asBytes32(hex: string): `0x${string}` {
  if (!hex.startsWith('0x')) throw new Error('bytes32 must start with 0x');
  if (hex.length !== 66) throw new Error(`bytes32 must be 66 chars, got ${hex.length}`);
  return hex as `0x${string}`;
}