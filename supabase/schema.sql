-- Supabase PostgreSQL Schema Migration

-- Drop tables if they exist for clean setup
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "meal_markings" CASCADE;
DROP TABLE IF EXISTS "student_notifications" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "extra_items" CASCADE;
DROP TABLE IF EXISTS "weekly_menu" CASCADE;
DROP TABLE IF EXISTS "app_settings" CASCADE;

-- Users (both Students and Admins)
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL CHECK ("role" IN ('student', 'admin')),
  "hostel" TEXT,
  "room" TEXT,
  "semester" INTEGER,
  "balance" NUMERIC(10, 2) DEFAULT 0.00
);

-- Extra Items (Canteen)
CREATE TABLE "extra_items" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL,
  "available" BOOLEAN DEFAULT true,
  "category" TEXT NOT NULL
);

-- Notifications (Global)
CREATE TABLE "notifications" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "type" TEXT NOT NULL
);

-- Student Notifications State (Read/Delete tracking)
CREATE TABLE "student_notifications" (
  "student_id" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "notification_id" TEXT REFERENCES "notifications"("id") ON DELETE CASCADE,
  "is_read" BOOLEAN DEFAULT false,
  "is_deleted" BOOLEAN DEFAULT false,
  PRIMARY KEY ("student_id", "notification_id")
);

-- Transactions (Balance additions and Meal deductions)
CREATE TABLE "transactions" (
  "id" TEXT PRIMARY KEY,
  "student_id" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "description" TEXT NOT NULL,
  "amount" NUMERIC(10, 2) NOT NULL,
  "type" TEXT NOT NULL CHECK ("type" IN ('credit', 'debit')),
  "category" TEXT NOT NULL
);

-- Meal Markings
CREATE TABLE "meal_markings" (
  "id" TEXT PRIMARY KEY,
  "student_id" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "meal_type" TEXT NOT NULL CHECK ("meal_type" IN ('breakfast', 'lunch', 'dinner')),
  "meal_category" TEXT NOT NULL CHECK ("meal_category" IN ('veg', 'nonveg')),
  "meal_price" NUMERIC(10, 2) NOT NULL,
  "marked_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "completed" BOOLEAN DEFAULT false
);

-- Weekly Menu
CREATE TABLE "weekly_menu" (
  "day" TEXT PRIMARY KEY,
  "breakfast" JSONB NOT NULL DEFAULT '[]',
  "lunch" JSONB NOT NULL DEFAULT '[]',
  "dinner" JSONB NOT NULL DEFAULT '[]'
);

-- App Settings (Timings, Config)
CREATE TABLE "app_settings" (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL
);

-- Create some indexes for common queries
CREATE INDEX "idx_transactions_student" ON "transactions"("student_id");
CREATE INDEX "idx_meal_markings_student" ON "meal_markings"("student_id");
CREATE INDEX "idx_meal_markings_date" ON "meal_markings"("marked_at");
