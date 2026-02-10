-- tap_eventsテーブル削除
DROP TABLE IF EXISTS public.tap_events;

-- tagsテーブルからNFC/Auth関連カラム削除（CASCADE で依存ポリシーも自動削除）
ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_owner_user_id_fkey;
ALTER TABLE public.tags DROP COLUMN IF EXISTS owner_user_id CASCADE;
ALTER TABLE public.tags DROP COLUMN IF EXISTS uid_hex;
ALTER TABLE public.tags DROP COLUMN IF EXISTS last_ctr;
ALTER TABLE public.tags DROP COLUMN IF EXISTS last_ctr_at;

-- パスワードハッシュカラム追加（SHA-256フル64文字、衝突検知用）
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';

-- 残りのRLSポリシー削除（CASCADEで消えなかった分）
DROP POLICY IF EXISTS "Owners can view tags" ON public.tags;
DROP POLICY IF EXISTS "Owners can insert tags" ON public.tags;
DROP POLICY IF EXISTS "Owners can update tags" ON public.tags;
DROP POLICY IF EXISTS "Owners can delete tags" ON public.tags;
DROP POLICY IF EXISTS "Owners can view audios" ON public.audios;
DROP POLICY IF EXISTS "Owners can insert audios" ON public.audios;
DROP POLICY IF EXISTS "Owners can delete audios" ON public.audios;
DROP POLICY IF EXISTS "Owners can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Owners can select audio files" ON storage.objects;

-- RLS無効化（全操作はサービスロール経由）
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audios DISABLE ROW LEVEL SECURITY;
