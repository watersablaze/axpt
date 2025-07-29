// lib/docs/docRegistry.ts

export interface DocMeta {
  slug: string;             // Used in route, e.g. /docs/whitepaper
  filename: string;         // The actual PDF filename
  title: string;
  subtitle: string;
  folder?: string;          // Optional, defaults to "AXPT"
}

export const docRegistry: DocMeta[] = [
  {
    slug: 'whitepaper',
    filename: 'whitepaper.pdf',
    title: 'AXPT Whitepaper',
    subtitle: 'Foundational Principles & Digital Architecture',
  },
  {
    slug: 'chinje',
    filename: 'chinje.pdf',
    title: 'CIM: Chinje Region',
    subtitle: 'Regional Economic Overview and Community Impact',
  },
  {
    slug: 'hemp',
    filename: 'hemp.pdf',
    title: 'Hemp Ecosystem',
    subtitle: 'Sustainable Agriculture & Resource Strategy',
  },
];