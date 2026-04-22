import { prisma } from '@/infrastructure/db/prisma';
import { registerCaseEventHandler } from './caseEventBus';

export function registerCaseEventLogger() {
  registerCaseEventHandler('CASE_CREATED', async (event) => {
    await prisma.eventLog.create({
      data: {
        caseId: event.payload.caseId,
        type: event.name,
        payload: event.payload.metadata ?? {},
      },
    });
  });

  registerCaseEventHandler('GATE_VERIFIED', async (event) => {
    await prisma.eventLog.create({
      data: {
        caseId: event.payload.caseId,
        type: event.name,
        payload: {
          gateId: event.payload.gateId,
          ...(event.payload.metadata ?? {}),
        },
      },
    });
  });

  registerCaseEventHandler('ARTIFACT_UPLOADED', async (event) => {
    await prisma.eventLog.create({
      data: {
        caseId: event.payload.caseId,
        type: event.name,
        payload: {
          artifactId: event.payload.artifactId,
          ...(event.payload.metadata ?? {}),
        },
      },
    });
  });
}