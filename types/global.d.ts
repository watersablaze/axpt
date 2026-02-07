// Global ambient type augmentations for project-local needs

declare module 'archiver' {
  const archiver: any;
  export default archiver;
}

declare module 'pdfkit' {
  const PDFDocument: any;
  export default PDFDocument;
}

declare module '@prisma/client' {
  // Minimal PartyRole export to satisfy imports; expand if/when roles are formalized.
  export enum PartyRole {
    OTHER = 'OTHER',
    PLAINTIFF = 'PLAINTIFF',
    DEFENDANT = 'DEFENDANT',
    WITNESS = 'WITNESS',
  }

  interface PrismaClient {
    [prop: string]: any;
    liveStream: any;
    nommoState: any;
    nommoEvent: any;
    walletEvent: any;
    chainMirrorJob: any;
  }

  interface TransactionClient extends PrismaClient {}

  // Common model/type shims to keep UI and script imports happy when Prisma schema is trimmed
  export type User = any;
  export type AccessCode = any;
  export type SessionLog = any;
  export type Wallet = any;
  export type Balance = any;
  export type Artifact = any;
  export type Case = any;
  export type EventLog = any;
  export type Gate = any;
  export type VerificationItem = any;
  export type TokenType = any;
  export type GovernanceProposal = any;

  // Value exports to keep common import styles working
  export const PrismaClient: any;
  export const Prisma: any;
  export const TokenType: any;
  export class PrismaClient {
    [prop: string]: any;
    constructor(...args: any[]);
  }
}
