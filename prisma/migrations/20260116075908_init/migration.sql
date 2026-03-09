-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolTrack" TEXT,
    "schoolForm" TEXT,
    "schoolName" TEXT,
    "level" TEXT,
    "grade" INTEGER
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "unterstufeOnly" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TeachingOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolTrack" TEXT NOT NULL,
    "schoolForm" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "minGrade" INTEGER NOT NULL,
    "maxGrade" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeachingOffer_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeachingOffer_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "offerId" TEXT,
    CONSTRAINT "Availability_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "TeachingOffer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Availability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "stripeSetupIntentId" TEXT,
    "stripePaymentIntentId" TEXT,
    "availabilityId" TEXT,
    CONSTRAINT "Booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeacherApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "letter" TEXT,
    "filePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetToken_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Chat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Chat_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolTrack_schoolForm_level_grade_idx" ON "User"("schoolTrack", "schoolForm", "level", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE INDEX "Teacher_email_idx" ON "Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "Subject_name_idx" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "TeachingOffer_teacherId_idx" ON "TeachingOffer"("teacherId");

-- CreateIndex
CREATE INDEX "TeachingOffer_subjectId_idx" ON "TeachingOffer"("subjectId");

-- CreateIndex
CREATE INDEX "TeachingOffer_schoolTrack_schoolForm_level_minGrade_maxGrade_idx" ON "TeachingOffer"("schoolTrack", "schoolForm", "level", "minGrade", "maxGrade");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingOffer_teacherId_subjectId_schoolForm_level_minGrade_maxGrade_key" ON "TeachingOffer"("teacherId", "subjectId", "schoolForm", "level", "minGrade", "maxGrade");

-- CreateIndex
CREATE INDEX "Availability_teacherId_idx" ON "Availability"("teacherId");

-- CreateIndex
CREATE INDEX "Availability_offerId_idx" ON "Availability"("offerId");

-- CreateIndex
CREATE INDEX "Availability_date_idx" ON "Availability"("date");

-- CreateIndex
CREATE INDEX "Booking_studentId_idx" ON "Booking"("studentId");

-- CreateIndex
CREATE INDEX "Booking_teacherId_idx" ON "Booking"("teacherId");

-- CreateIndex
CREATE INDEX "Booking_start_idx" ON "Booking"("start");

-- CreateIndex
CREATE INDEX "Booking_availabilityId_idx" ON "Booking"("availabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherApplication_email_key" ON "TeacherApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_teacherId_idx" ON "PasswordResetToken"("teacherId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Chat_teacherId_idx" ON "Chat"("teacherId");

-- CreateIndex
CREATE INDEX "Chat_studentEmail_idx" ON "Chat"("studentEmail");

-- CreateIndex
CREATE INDEX "Chat_bookingId_idx" ON "Chat"("bookingId");

-- CreateIndex
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");
