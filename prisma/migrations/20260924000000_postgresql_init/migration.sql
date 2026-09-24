-- Visual360 PostgreSQL baseline
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "password" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "TourProject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "shareSlug" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "TourProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Floor" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "planImage" TEXT,
  "projectId" TEXT NOT NULL,
  CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TourPoint" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "x" DOUBLE PRECISION NOT NULL,
  "y" DOUBLE PRECISION NOT NULL,
  "panoramaUrl" TEXT NOT NULL,
  "panoramaType" TEXT NOT NULL DEFAULT 'image',
  "pitch" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "yaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fov" DOUBLE PRECISION NOT NULL DEFAULT 75,
  "floorId" TEXT NOT NULL,
  CONSTRAINT "TourPoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Connection" (
  "id" TEXT NOT NULL,
  "fromId" TEXT NOT NULL,
  "toId" TEXT NOT NULL,
  CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Branding" (
  "id" TEXT NOT NULL,
  "logo" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
  "companyName" TEXT,
  "contactInfo" TEXT,
  "projectId" TEXT NOT NULL,
  CONSTRAINT "Branding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Walkthrough" (
  "id" TEXT NOT NULL,
  "pointIds" TEXT NOT NULL DEFAULT '[]',
  "autoplay" BOOLEAN NOT NULL DEFAULT false,
  "interval" INTEGER NOT NULL DEFAULT 5,
  "narrationUrl" TEXT,
  "projectId" TEXT NOT NULL,
  CONSTRAINT "Walkthrough_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "TourProject_shareSlug_key" ON "TourProject"("shareSlug");
CREATE INDEX "TourProject_userId_updatedAt_idx" ON "TourProject"("userId", "updatedAt");
CREATE INDEX "Floor_projectId_order_idx" ON "Floor"("projectId", "order");
CREATE INDEX "TourPoint_floorId_idx" ON "TourPoint"("floorId");
CREATE UNIQUE INDEX "Connection_fromId_toId_key" ON "Connection"("fromId", "toId");
CREATE INDEX "Connection_toId_idx" ON "Connection"("toId");
CREATE UNIQUE INDEX "Branding_projectId_key" ON "Branding"("projectId");
CREATE UNIQUE INDEX "Walkthrough_projectId_key" ON "Walkthrough"("projectId");

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourProject"
  ADD CONSTRAINT "TourProject_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Floor"
  ADD CONSTRAINT "Floor_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "TourProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourPoint"
  ADD CONSTRAINT "TourPoint_floorId_fkey"
  FOREIGN KEY ("floorId") REFERENCES "Floor"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_fromId_fkey"
  FOREIGN KEY ("fromId") REFERENCES "TourPoint"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_toId_fkey"
  FOREIGN KEY ("toId") REFERENCES "TourPoint"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Branding"
  ADD CONSTRAINT "Branding_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "TourProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Walkthrough"
  ADD CONSTRAINT "Walkthrough_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "TourProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
