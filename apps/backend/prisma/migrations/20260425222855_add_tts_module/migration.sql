-- CreateEnum
CREATE TYPE "TtsProvider" AS ENUM ('minimax', 'cartesia');

-- CreateTable
CREATE TABLE "question_audio" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "configHash" TEXT NOT NULL,
    "provider" "TtsProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "voiceId" TEXT,
    "mimeType" TEXT NOT NULL,
    "audioPath" TEXT NOT NULL,
    "wordTimestamps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_audio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_audio_questionId_idx" ON "question_audio"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_audio_questionId_configHash_key" ON "question_audio"("questionId", "configHash");

-- AddForeignKey
ALTER TABLE "question_audio" ADD CONSTRAINT "question_audio_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
