// ✅ File: app/types/global.ts

export interface SearchParamLoaderProps {
  token: string;
  status: 'idle' | 'verifying' | 'success' | 'error';
  verifiedPartner: string | null;
  acceptTerms: boolean;
  setToken: (val: string) => void;
  setStatus: (val: 'idle' | 'verifying' | 'success' | 'error') => void;
  setVerifiedPartner: (val: string | null) => void;
  setAcceptTerms: (val: boolean) => void;
  onVerify: () => void;
}