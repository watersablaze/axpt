import { getGateQueue } from "@/domains/cases/services/getGateQueue"

export async function GET() {

  const gates = await getGateQueue()

  return Response.json(gates)

}