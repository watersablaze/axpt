import { toast } from 'sonner'
import type { WhyExplanation } from '@/domains/explainability/whyEngine'

export function toastWhy(explanation: WhyExplanation) {
  toast(
    `${explanation.summary}`,
    {
      description: explanation.factors.join('\n'),
    }
  )
}