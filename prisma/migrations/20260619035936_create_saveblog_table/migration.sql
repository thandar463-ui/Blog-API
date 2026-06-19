-- AlterTable
ALTER TABLE "blogs" ALTER COLUMN "excerpt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SavedBlog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedBlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedBlog_userId_blogId_key" ON "SavedBlog"("userId", "blogId");

-- AddForeignKey
ALTER TABLE "SavedBlog" ADD CONSTRAINT "SavedBlog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedBlog" ADD CONSTRAINT "SavedBlog_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
