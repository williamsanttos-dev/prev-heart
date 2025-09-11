/*
  Warnings:

  - You are about to drop the column `device_id` on the `push_token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."push_token" DROP COLUMN "device_id";
