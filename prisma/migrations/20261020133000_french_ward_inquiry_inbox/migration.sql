CREATE TABLE "FrenchWardInquiry" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FrenchWardInquiry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FrenchWardInquiry_status_check" CHECK ("status" IN ('OPEN','IN_REVIEW','CLOSED'))
);
CREATE TABLE "FrenchWardInquiryEvent" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FrenchWardInquiryEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FrenchWardInquiryEvent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "FrenchWardInquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "FrenchWardInquiry_status_createdAt_idx" ON "FrenchWardInquiry"("status", "createdAt");
CREATE INDEX "FrenchWardInquiryEvent_inquiryId_createdAt_idx" ON "FrenchWardInquiryEvent"("inquiryId", "createdAt");
