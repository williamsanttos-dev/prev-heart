/*
  Warnings:

  - You are about to drop the column `bpm` on the `elder_profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "elder_profile" DROP COLUMN "bpm",
ADD COLUMN     "last_bpm" INTEGER,
ADD COLUMN     "last_bpm_measured_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "heart_rate_measurements" (
    "id" SERIAL NOT NULL,
    "elder_id" INTEGER NOT NULL,
    "bpm" INTEGER NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "external_reading_id" VARCHAR(100),
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "heart_rate_measurements_id_key" ON "heart_rate_measurements"("id");

-- CreateIndex
CREATE INDEX "heart_rate_measurements_elder_id_measured_at_idx" ON "heart_rate_measurements"("elder_id", "measured_at");

-- AddForeignKey
ALTER TABLE "heart_rate_measurements" ADD CONSTRAINT "heart_rate_measurements_elder_id_fkey" FOREIGN KEY ("elder_id") REFERENCES "elder_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
