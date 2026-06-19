CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"contact" text NOT NULL,
	"student_id" text,
	"text_content" text NOT NULL,
	"audio_url" text,
	"category" varchar(50) NOT NULL,
	"sentiment" varchar(50) NOT NULL,
	"priority" varchar(50) NOT NULL,
	"topics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
