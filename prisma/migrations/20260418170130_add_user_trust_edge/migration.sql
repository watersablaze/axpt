-- CreateIndex
CREATE INDEX "UserTrustEdge_fromUserId_idx" ON "UserTrustEdge"("fromUserId");

-- CreateIndex
CREATE INDEX "UserTrustEdge_toUserId_idx" ON "UserTrustEdge"("toUserId");
