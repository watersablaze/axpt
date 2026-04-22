import { getEscrowRisk } from "@/domains/escrow/services/getEscrowRisk"

export async function GET() {

  const data = await getEscrowRisk()

  return Response.json(data)

}