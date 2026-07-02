/*
  Warnings:

  - A unique constraint covering the columns `[createdAt,id]` on the table `blogs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "blogs_createdAt_id_key" ON "blogs"("createdAt", "id");
