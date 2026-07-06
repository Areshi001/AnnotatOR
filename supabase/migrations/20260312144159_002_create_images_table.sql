/*
  # Create images table

  1. New Tables
    - `images`
      - `id` (uuid, primary key)
      - `projectId` (uuid, foreign key to projects)
      - `"fileName"` (text)
      - `storageUrl` (text, path in Storage)
      - `split` (enum: train, val, test)
      - `annotated` (boolean, defaults to false)
      - `uploadedAt` (timestamptz)

  2. Security
    - Enable RLS on `images` table
    - Add policy for public read/write access for MVP
*/

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "fileName" text NOT NULL,
  storageUrl text NOT NULL,
  split text DEFAULT 'train' CHECK (split IN ('train', 'val', 'test')),
  annotated boolean DEFAULT false,
  uploadedAt timestamptz DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images are viewable by everyone"
  ON images
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert images"
  ON images
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update images"
  ON images
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete images"
  ON images
  FOR DELETE
  USING (true);

CREATE INDEX idx_images_projectId ON images(projectId);
CREATE INDEX idx_images_annotated ON images(annotated);
