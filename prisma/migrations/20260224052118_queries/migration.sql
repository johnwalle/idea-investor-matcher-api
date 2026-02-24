-- CreateIndex
CREATE INDEX "Idea_industry_idx" ON "Idea"("industry");

-- CreateIndex
CREATE INDEX "Idea_fundingAmount_idx" ON "Idea"("fundingAmount");

-- CreateIndex
CREATE INDEX "Idea_stage_idx" ON "Idea"("stage");

-- CreateIndex
CREATE INDEX "Idea_region_idx" ON "Idea"("region");

-- CreateIndex
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");

-- CreateIndex
CREATE INDEX "Idea_industry_fundingAmount_idx" ON "Idea"("industry", "fundingAmount");
