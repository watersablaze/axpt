export type FieldNoteRecord = {
  number: string
  date: string
  title: string
  domains: string
  href: string
  status: 'CURRENT' | 'ARCHIVED'
}

export const FIELD_NOTES: FieldNoteRecord[] = [
  {
    number: '001',
    date: 'September 2026',
    title: 'When Gold Exists but Passage Is Not Yet Governed',
    domains: 'Trade / Source Authority / Export Governance',
    href: '#field-notes',
    status: 'CURRENT',
  },
]
