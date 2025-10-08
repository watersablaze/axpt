import { CadaWelcome } from '@/lib/email/templates/cadaWelcome';

export default function Page() {
  return <CadaWelcome recipientName="Friend of CADA" />;
}