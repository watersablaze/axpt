CREATE TABLE IF NOT EXISTS "Case" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  jurisdiction TEXT,
  mode TEXT NOT NULL DEFAULT 'COORDINATION_ONLY',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  referenceCode TEXT UNIQUE,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Party" (
  id TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "Case"(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  "entityName" TEXT NOT NULL,
  "authorizedSignatory" TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Gate" (
  id TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "Case"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ord INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  UNIQUE ("caseId", ord)
);

CREATE TABLE IF NOT EXISTS "VerificationItem" (
  id TEXT PRIMARY KEY,
  "gateId" TEXT NOT NULL REFERENCES "Gate"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "EventLog" (
  id TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "Case"(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail JSONB,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Artifact" (
  id TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "Case"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  hash TEXT,
  url TEXT,
  "uploadedBy" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);
