import { prisma } from '@/lib/prisma'
import {
  buildDossierTemplateContext,
} from './buildDossierTemplateContext'
import {
  renderSpaTemplate,
} from './templates/spaTemplate'
import {
  renderAnnexADeliveryTemplate,
} from './templates/annexADeliveryTemplate'
import {
  renderAnnexBSettlementTemplate,
} from './templates/annexBSettlementTemplate'
import {
  renderAnnexCRefineryTemplate,
} from './templates/annexCRefineryTemplate'
import {
  renderAnnexDComplianceTemplate,
} from './templates/annexDComplianceTemplate'
import type {
  DossierInstrumentRenderResult,
} from './templates/types'

type RenderDossierInstrumentInput = {
  instrumentId: string
}

export async function renderDossierInstrument({
  instrumentId,
}: RenderDossierInstrumentInput): Promise<DossierInstrumentRenderResult> {
  const instrument =
    await prisma.transactionDossierInstrument.findUnique({
      where: {
        id: instrumentId,
      },
      select: {
        id: true,
        dossierId: true,
        type: true,
        title: true,
      },
    })

  if (!instrument) {
    throw new Error('INSTRUMENT_NOT_FOUND')
  }

  const context =
    await buildDossierTemplateContext(
      instrument.dossierId
    )

  switch (instrument.type) {
    case 'SPA':
      return renderSpaTemplate(context)

    case 'ANNEX_A_DELIVERY':
      return renderAnnexADeliveryTemplate(context)

    case 'ANNEX_B_SETTLEMENT':
      return renderAnnexBSettlementTemplate(context)

    case 'ANNEX_C_REFINERY':
      return renderAnnexCRefineryTemplate(context)

    case 'ANNEX_D_COMPLIANCE':
      return renderAnnexDComplianceTemplate(context)

    default:
      return {
        instrumentType: instrument.type,
        title: instrument.title,
        renderedText:
          `${instrument.title}\n\nTemplate renderer is not implemented for ${instrument.type} yet.`,
        missingFields: [],
        warnings: [
          {
            field: 'instrument.type',
            label: 'Template not implemented',
            status: 'WARNING',
            detail:
              `No renderer has been implemented for ${instrument.type} yet.`,
          },
        ],
      }
  }
}
