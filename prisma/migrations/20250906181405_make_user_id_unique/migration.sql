/*
  Warnings:

  - You are about to drop the column `revoked` on the `push_token` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `push_token` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."push_token" DROP COLUMN "revoked";

-- CreateIndex
CREATE UNIQUE INDEX "push_token_user_id_key" ON "public"."push_token"("user_id");
