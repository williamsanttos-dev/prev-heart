-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('elder', 'caregiver', 'admin');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" SERIAL NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."elder_profile" (
    "user_id" INTEGER NOT NULL,
    "caregiver_id" INTEGER,
    "bpm" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."caregiver_profile" (
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "user_cpf_key" ON "public"."user"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "elder_profile_user_id_key" ON "public"."elder_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "elder_profile_caregiver_id_key" ON "public"."elder_profile"("caregiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_profile_user_id_key" ON "public"."caregiver_profile"("user_id");

-- AddForeignKey
ALTER TABLE "public"."elder_profile" ADD CONSTRAINT "elder_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."elder_profile" ADD CONSTRAINT "elder_profile_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "public"."caregiver_profile"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caregiver_profile" ADD CONSTRAINT "caregiver_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
