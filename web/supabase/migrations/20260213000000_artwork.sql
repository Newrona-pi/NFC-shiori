-- tagsテーブルにアートワーク画像パスカラムを追加
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS artwork_path text;
