import { redirect } from 'next/navigation'

export default function LegacyCommandCenterRedirect() {
  redirect('/admin/control-center')
}