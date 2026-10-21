import type { PrismaClient } from "@prisma/client";
import { commercialPapers, commercialPaperPinMatches } from "./catalog";

/** Routes also evaluate the canonical CUP consumption contract before invoking this loader. */
export async function loadRepresentativeCommercialPaper(input: {
  client: Pick<PrismaClient, "commercialUtilityPackResourceRelease">;
  userId: string; resourceReleaseId: string;
}) {
  const userId = input.userId.trim(), resourceReleaseId = input.resourceReleaseId.trim();
  if (!userId || !resourceReleaseId || resourceReleaseId.length > 191) return null;
  const papers = commercialPapers();
  const resource = await input.client.commercialUtilityPackResourceRelease.findFirst({where: {
    id: resourceReleaseId, module: "DOCUMENTS", resourceType: "STRUCTURED_CONTENT",
    resourceId: {in: papers.map(paper => paper.reference)}, state: "RELEASED", canView: true,
    package: {version: 1, audience: "REPRESENTATIVE", state: {in: ["PREPARING", "CURRENT"]},
      releaseState: {in: ["PARTIAL", "RELEASED"]}, participant: {userId},
      modules: {some: {module: "DOCUMENTS", state: "RELEASED"}}},
  }, select: {resourceId: true, metadata: true}});
  if (!resource) return null;
  const paper = papers.find(candidate => candidate.reference === resource.resourceId);
  return paper && commercialPaperPinMatches(resource.metadata, paper) ? paper : null;
}
