-- tagsテーブルにアートワーク画像パスカラムを追加
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS artwork_path text;

-- 画像用ストレージバケット作成（audiosバケットはaudio/*のみ許可のため）
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('artworks', 'artworks', false, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
