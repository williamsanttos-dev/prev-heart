/*
  Warnings:

  - The values [web] on the enum `Platform` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `locale` on the `push_token` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `push_token` table. All the data in the column will be lost.
  - Made the column `os_version` on table `push_token` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Platform_new" AS ENUM ('ios', 'android');
ALTER TABLE "public"."push_token" ALTER COLUMN "platform" TYPE "public"."Platform_new" USING ("platform"::text::"public"."Platform_new");
ALTER TYPE "public"."Platform" RENAME TO "Platform_old";
ALTER TYPE "public"."Platform_new" RENAME TO "Platform";
DROP TYPE "public"."Platform_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."push_token" DROP COLUMN "locale",
DROP COLUMN "metadata",
ALTER COLUMN "os_version" SET NOT NULL;
