/*
  Warnings:

  - You are about to drop the column `viewAt` on the `View` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,blogId,viewedAt]` on the table `View` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `viewedAt` to the `View` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "View_userId_blogId_viewAt_key";

-- AlterTable
ALTER TABLE "View" DROP COLUMN "viewAt",
ADD COLUMN     "viewedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "View_userId_blogId_viewedAt_key" ON "View"("userId", "blogId", "viewedAt");
