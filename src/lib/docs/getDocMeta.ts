// lib/docs/getDocMeta.ts

import { docRegistry, DocMeta } from './docRegistry';

export function getDocMetaByFilename(filename: string): DocMeta | undefined {
  const lower = filename.toLowerCase();
  return docRegistry.find(
    (doc) => doc.filename.toLowerCase() === lower
  );
}

export function getDocMetaBySlug(slug: string): DocMeta | undefined {
  return docRegistry.find((doc) => doc.slug === slug);
}