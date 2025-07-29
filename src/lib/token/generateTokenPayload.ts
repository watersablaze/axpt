// 📁 src/lib/token/generateTokenPayload.ts

import { TokenPayload, allowedDocEnum } from './tokenSchema';

export function generateTokenPayload(params: {
  partner: string;
  tier: string;
  docs?: string[];
  displayName?: string;
  greeting?: string;
  popupMessage?: string;
  userId: string;
  iat?: number;
  exp?: number;
  email?: string;
}): TokenPayload {
  const enumOptions = allowedDocEnum.options as readonly string[];

  const filteredDocs = (params.docs || []).filter(
    (doc): doc is typeof enumOptions[number] =>
      enumOptions.includes(doc)
  );

  return {
    partner: params.partner,
    tier: params.tier as TokenPayload['tier'],
    docs: filteredDocs as TokenPayload['docs'],
    displayName: params.displayName,
    greeting: params.greeting,
    popupMessage: params.popupMessage,
    userId: params.userId,
    email: params.email,
    iat: params.iat || Math.floor(Date.now() / 1000),
    exp: params.exp || Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
}