export const docLabelMap: Record<string, string> = {
  whitepaper: 'AXPT Whitepaper',
  hemp: 'Hemp Ecosystem',
  chinje: 'CIM Chinje Project',
};

export function getDocLabel(slug: string) {
  return docLabelMap[slug] ?? slug;
}