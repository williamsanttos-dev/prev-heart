-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('ios', 'android', 'web');

-- CreateTable
CREATE TABLE "public"."push_token" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expo_token_push" TEXT NOT NULL,
    "device_id" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "os_version" TEXT,
    "locale" TEXT,
    "metadata" JSONB,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "last_sent_at" TIMESTAMP(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "push_token_id_key" ON "public"."push_token"("id");

-- CreateIndex
CREATE UNIQUE INDEX "push_token_expo_token_push_key" ON "public"."push_token"("expo_token_push");

-- CreateIndex
CREATE INDEX "push_token_user_id_idx" ON "public"."push_token"("user_id");

-- CreateIndex
CREATE INDEX "push_token_last_active_at_idx" ON "public"."push_token"("last_active_at");

-- AddForeignKey
ALTER TABLE "public"."push_token" ADD CONSTRAINT "push_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
