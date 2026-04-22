import { PrismaClient } from "@prisma/client"
import { parseDisplayToBaseUnits } from "@/lib/money/baseUnits"
import { getAsset } from "@/lib/assets/registry"

const prisma = new PrismaClient()

async function run() {
  const balances = await prisma.balance.findMany()

  for (const b of balances) {
    if (!b.amount) continue
    if (b.amountBaseUnits) continue

    const assetCode = "AXG" // TEMP: adjust mapping logic
    const asset = getAsset(assetCode)

    const baseUnits = parseDisplayToBaseUnits(
      b.amount.toString(),
      asset.decimals
    )

    await prisma.balance.update({
      where: { id: b.id },
      data: {
        assetCode,
        amountBaseUnits: baseUnits.toString(),
      },
    })
  }

  console.log("Balance backfill complete")
}

run()