/*
  Warnings:

  - A unique constraint covering the columns `[device_id]` on the table `elder_profile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."elder_profile" ADD COLUMN     "device_id" VARCHAR(8);

-- CreateIndex
CREATE UNIQUE INDEX "elder_profile_device_id_key" ON "public"."elder_profile"("device_id");
