-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "interviewForm" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_topic" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_item" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "suggestedDurationSec" INTEGER NOT NULL DEFAULT 120,
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "keywords" TEXT[],
    "focusWords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_content" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "promptEn" TEXT NOT NULL,
    "promptZh" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "answerZh" TEXT NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "question_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_binding_config" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "interviewForm" TEXT NOT NULL,
    "bankId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_binding_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_question" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_word" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT,
    "sourceQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_record" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_progress" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "seenAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_paper" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "paperType" TEXT NOT NULL DEFAULT 'standard',
    "suggestedMinutes" INTEGER NOT NULL DEFAULT 30,
    "focus" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_paper_question" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mock_paper_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_exam_record" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "weakness" TEXT[],
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_exam_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activity" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preference" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "autoPlay" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "features" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "membership_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_item_topicId_difficulty_idx" ON "question_item"("topicId", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "question_content_questionId_key" ON "question_content"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_binding_config_deviceId_key" ON "user_binding_config"("deviceId");

-- CreateIndex
CREATE INDEX "favorite_question_deviceId_createdAt_idx" ON "favorite_question"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_question_deviceId_questionId_key" ON "favorite_question"("deviceId", "questionId");

-- CreateIndex
CREATE INDEX "vocabulary_word_deviceId_createdAt_idx" ON "vocabulary_word"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_word_deviceId_term_key" ON "vocabulary_word"("deviceId", "term");

-- CreateIndex
CREATE INDEX "practice_record_deviceId_createdAt_idx" ON "practice_record"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "practice_progress_deviceId_questionId_key" ON "practice_progress"("deviceId", "questionId");

-- CreateIndex
CREATE INDEX "mock_exam_record_deviceId_takenAt_idx" ON "mock_exam_record"("deviceId", "takenAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_deviceId_date_key" ON "daily_activity"("deviceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_preference_deviceId_key" ON "user_preference"("deviceId");

-- AddForeignKey
ALTER TABLE "question_topic" ADD CONSTRAINT "question_topic_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_item" ADD CONSTRAINT "question_item_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "question_topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_content" ADD CONSTRAINT "question_content_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_binding_config" ADD CONSTRAINT "user_binding_config_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_question" ADD CONSTRAINT "favorite_question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_word" ADD CONSTRAINT "vocabulary_word_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "question_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_record" ADD CONSTRAINT "practice_record_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_progress" ADD CONSTRAINT "practice_progress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_paper" ADD CONSTRAINT "mock_paper_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_paper_question" ADD CONSTRAINT "mock_paper_question_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "mock_paper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_paper_question" ADD CONSTRAINT "mock_paper_question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_record" ADD CONSTRAINT "mock_exam_record_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "mock_paper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
