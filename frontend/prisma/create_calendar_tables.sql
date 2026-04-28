CREATE TABLE IF NOT EXISTS "CalendarPost" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalendarPlatform" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "CalendarPlatform_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CalendarPlatform"
  DROP CONSTRAINT IF EXISTS "CalendarPlatform_postId_fkey";

ALTER TABLE "CalendarPlatform"
  ADD CONSTRAINT "CalendarPlatform_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "CalendarPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
