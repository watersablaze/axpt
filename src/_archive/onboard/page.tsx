// 📁 app/onboard/page.tsx
import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/onboard/investor');
}