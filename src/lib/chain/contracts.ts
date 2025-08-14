import { Contract } from 'ethers';
import { getProvider, getCouncilSigner } from './clients';
import { requireAddress } from './addresses';
import ProtiumTokenAbi from '@/contracts/abi/ProtiumToken.json';

// Read-only by default; pass readonly=false where a signer is required.
export function getProtiumToken(readonly = true): Contract {
  const signerOrProvider = readonly ? getProvider() : getCouncilSigner();
  const address = requireAddress('token');
  return new Contract(address, ProtiumTokenAbi as any, signerOrProvider);
}