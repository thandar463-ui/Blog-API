/*
  Warnings:

  - A unique constraint covering the columns `[blogId,viewedAt,userId]` on the table `View` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "View_blogId_idx";

-- DropIndex
DROP INDEX "View_userId_blogId_viewedAt_key";

-- DropIndex
DROP INDEX "View_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "View_blogId_viewedAt_userId_key" ON "View"("blogId", "viewedAt", "userId");
