あなたはシニアフルスタックエンジニアです。以下の要件を満たすWebサービスを、Next.js + TypeScript + Supabaseで実装してください。質問は最小限にし、曖昧な点は妥当なデフォルトで決めて前進してください（決めた前提はREADMEに明記）。

# 1. 目的（全体像）
NTAG 424 DNA の SDM（Secure Dynamic Messaging）を使った NFC タップ限定アクセスの音声サービスを作る。

- NFCタグにはURL（NDEF）が入っており、スマホでタップするとURLが開く。
- ただし「URLを一度知ったらタップ無しでも開ける」状態はNG。
  => SDMの動的パラメータ（暗号化データ+CMAC）をサーバで検証し、検証OKの時だけ視聴ページ（サイトA）を開けるようにする。
- サイトA（リスナー向け）：
  - アクセスした瞬間に「最新音声」を自動再生を試みる（失敗したらワンタップで再生できるUIにフォールバック）。
  - 過去音声の一覧もあり、いつでも再生可能（自動再生は最新のみ）。
- サイトB（投稿者向け）：
  - ログインしたユーザーが音声ファイルのみアップロード可能。
  - アップロードされた音声はSupabase Storageに保存、メタ情報はDBに保存。
  - 新規アップロードが「最新音声」に切り替わる。
  - 古い音声は蓄積してサイトAで聞ける。

複数ユーザー対応：
- ユーザーαが投稿した音声は、ユーザーαのNFCタグ（=αのタグ）から開くサイトAで再生される。
- ユーザーβも同様。
- タグ（NFC）とユーザーの紐付け（オーナー）をDBで管理する。

# 2. 技術スタック（固定）
- Next.js (App Router) + TypeScript
- Supabase:
  - Postgres (DB)
  - Storage (音声ファイル保存)
  - Auth (サイトBのログイン)
- デプロイ：Vercel想定（ローカルでも動くこと）
- Node.js 20 以上

# 3. 重要なセキュリティ要件
(1) NFCタップ限定アクセス
- タグのURLは以下のような形式（例）：
  https://YOUR_DOMAIN/tap?tid=<TAG_UUID>&e=<PICCENC>&c=<CMAC>
  - tid：タグを識別する静的ID（漏れてもOK）
  - e,c：SDMの動的パラメータ（毎回変わる）
- /tap で e,c を検証し、OKなら短寿命セッション(cookie)を発行してサイトAにリダイレクト。
- サイトAはこのセッションが無いと閲覧不可（「タグをタップしてください」表示）。
- リプレイ（過去のURLコピペ）対策として、SDMReadCtr（カウンタ）をDBで記録し、古いカウンタは拒否する。
  - ただし同一ctrの連続アクセス（リロード等）を少し許容する（例：10秒以内は許容）等の実運用ルールを入れる。

(2) 音声ファイルの直リンク漏洩対策
- Storageバケットは private にする。
- サイトAでは、サーバ側で短寿命のSigned URLを発行して再生させる。
- Signed URL発行APIも「NFCセッション(cookie)がある」場合のみ許可。

(3) サイトB（アップロード）はSupabase Auth必須
- ユーザーは自分のタグに対してのみアップロード可能。
- RLS（Row Level Security）/ サーバ検証で他人のタグへの投稿を防ぐ。

# 4. SDM検証（NTAG 424 DNA）
- SDMの検証はバックエンド（Next.js API route）で行う。
- 実装方針：
  - 可能なら既存のSDM検証実装（例：NTAG 424 DNA SDMのPython実装等）をTypeScriptに移植して利用。
  - もしくは AES-CMAC / 復号 / セッション鍵導出を仕様（NXPのAN12196相当）に基づいて実装。
- ここでは「タグは e(暗号化PICCデータ) と c(CMAC) をクエリに出す設定済み」を前提にする。
- 検証関数 verifySdm(e,c,tagConfig) は以下を返す：
  - uidHex: string
  - ctr: number
  - ok: boolean
- verifySdmがokなら、(tid,uid,ctr)の整合もチェック：
  - tags.uid_hex が登録済みなら一致必須
  - 未登録なら初回成功時にuid_hexを保存（タグの“固定UID”として紐付け確定）

# 5. DB設計（Supabase SQLを生成）
必要なテーブル：
- profiles（任意：表示名など）
- tags（NFCタグ/チャンネル）
- audios（音声の履歴）
- tap_events（任意：タップログ）
- tag_access_state（last_ctr等。tagsに持たせても可）

必須要件：
- tags は owner_user_id（auth.users.id）を持つ
- tags は publicSlug（例：alpha, beta）を持つ（サイトAのURLに使う）
- audios は tag_id を持つ
- audios は created_at で最新判定できる
- “最新”を高速に引くため tags.latest_audio_id を持っても良い（トリガーで更新）

SQL（例。必要に応じて改善してOK）を最終的に /supabase/migrations に置くこと：

-- tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  display_name text,
  uid_hex text unique, -- 初回tapで確定 or 事前登録
  latest_audio_id uuid,
  last_ctr bigint,
  last_ctr_at timestamptz,
  created_at timestamptz not null default now()
);

-- audios
create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id) on delete cascade,
  storage_path text not null,
  title text,
  duration_ms int,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists audios_tag_created_idx on public.audios(tag_id, created_at desc);

-- latest audio trigger（tags.latest_audio_id を更新）
create or replace function public.set_latest_audio() returns trigger
language plpgsql as $$
begin
  update public.tags set latest_audio_id = new.id where id = new.tag_id;
  return new;
end $$;

drop trigger if exists trg_set_latest_audio on public.audios;
create trigger trg_set_latest_audio
after insert on public.audios
for each row execute function public.set_latest_audio();

-- tap logs (任意)
create table if not exists public.tap_events (
  id bigserial primary key,
  tag_id uuid not null references public.tags(id) on delete cascade,
  uid_hex text not null,
  ctr bigint not null,
  created_at timestamptz not null default now(),
  ip_hash text
);

RLS方針：
- tags：authユーザーは自分のowner_user_idの行だけ select/update
- audios：authユーザーは自分のタグに紐づく音声だけ select/insert/delete
- サイトA（匿名閲覧）はDBを直接叩かず、Next.jsサーバ側（service role）経由で提供する（cookie検証を通すため）。

# 6. ルーティング（単一アプリ内にA/Bを作る）
- /tap  … NFCが開く入口（SDM検証→cookie→リダイレクト）
- /a/[slug] … サイトA（視聴ページ）
- /studio … サイトB（投稿者ダッシュボード）
- /studio/tags … 自分のタグ一覧
- /studio/tags/[tagId] … タグ管理（アップロード、履歴表示）
- /studio/login … ログイン

API routes：
- GET  /api/tap?tid=...&e=...&c=...
  - SDM検証
  - リプレイチェック（ctr）
  - tapセッションcookie発行（httpOnly, Secure, SameSite=Lax, Max-Age=10min）
  - /a/[slug] に302リダイレクト

- GET  /api/public/tags/[slug]
  - cookie（tapセッション）必須
  - タグ情報 + 最新音声ID + 過去音声一覧メタ情報を返す

- POST /api/public/audio/signed-url
  - body: { audioId }
  - cookie必須 + audioがcookieのtagに属すること
  - Supabase Storageの短寿命Signed URLを返す（例：5分）

- POST /api/studio/upload/init
  - Supabase Auth必須
  - body: { tagId, filename, mimeType }
  - ownershipチェック
  - アップロード先パス決定（tags/<tagId>/<audioId>.<ext>）
  - Signed Upload URL（もしくはサーバ側アップロード用の一時トークン）を返す

- POST /api/studio/upload/commit
  - Auth必須
  - body: { tagId, storagePath, title, mimeType, sizeBytes, durationMs }
  - audiosにinsertし、latestを更新

# 7. “タップ限定”セッション設計（cookie/JWT）
- /tap 成功時に server がJWTを発行し httpOnly cookieに保存：
  - payload: { tagId, uidHex, issuedAt, exp }
  - exp: 10分（MVP）
- /a/[slug] や public API ではこのcookieを検証し、tagIdが一致する場合のみ許可。
- 追加要件（任意だが推奨）：
  - cookieのtagIdと slug のtagIdの一致必須
  - ctrの更新時刻 last_ctr_at を見て、同ctrの連続アクセス許容時間を制御（例：10秒）

# 8. サイトA UI/UX要件
- ページロード時：
  - まず /api/public/tags/[slug] を呼んで音声一覧（メタ）取得
  - 最新audioIdに対して /api/public/audio/signed-url でURL取得
  - <audio> で play() を試す
  - 自動再生がブロックされたら、目立つ「再生」ボタンを出す（クリックで再生）
- UI表示：
  - 上部：タグのdisplay_name（例：ユーザーα）
  - “最新音声”カード：再生/一時停止、時間表示
  - “過去音声”リスト：タイトル/日時、押すとその音声に切替＆再生
- パフォーマンス：
  - 過去一覧はページネーション（例：20件）または無限スクロール
- アクセス拒否時：
  - cookieが無い/期限切れ：説明文「NFCタグをタップしてください」＋簡易ヘルプ

# 9. サイトB UI/UX要件
- Supabase Authでログイン（メールリンク or パスワード。MVPはメール+パスワード）
- 自分のtags一覧を表示
- タグ詳細で：
  - 音声アップロード（ドラッグ&ドロップ + ファイル選択）
  - 受け付ける拡張子/Content-Typeは audio/* のみ（mp3, wav, m4a, webm, ogg など）
  - アップロード成功で即一覧更新
  - 過去音声も確認・再生できる（投稿者は常に見れる）
- タグの作成/登録：
  - MVP：ユーザーが「タグを作成」すると tags行が作られ、tid（tags.id）が確定する。
  - その tid を使ってNFCタグのURLに埋め込む想定（運用手順をREADMEに書く）。
  - 初回tap成功時に uid_hex が確定される（以後は一致チェックでなりすまし防止）。

# 10. タグ書き込み（運用手順をREADMEに必ず記載）
- タグには以下の形式のURLをNDEFとして書く：
  https://YOUR_DOMAIN/tap?tid=<tagId>&e=<<PICCENC>>&c=<<CMAC>>
- <<PICCENC>> と <<CMAC>> はタグのSDM設定で自動付与される前提。
- どのキーを使うか（Meta Read Key / File Read Keyなど）は .env の値と一致させること。
- 開発用として、SDM検証をバイパスする “DEV_TAP” も用意：
  - 例：/dev/tap?tid=<tagId> でcookie発行（本番では無効）

# 11. 実装成果物（必須）
- Next.jsプロジェクト一式
- supabase migration SQL
- RLS方針（READMEに記載）
- .env.example（必要な環境変数一覧）
- ローカル起動手順（README）
- データフロー図（READMEに簡易でOK）

環境変数例：
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY   （サーバ専用）
- JWT_SECRET                  （tapセッション署名）
- SDM_META_READ_KEY_HEX       （16バイトhex）
- SDM_FILE_READ_KEY_HEX       （16バイトhex）
- APP_BASE_URL                （https://...）

# 12. 受け入れ基準（動作確認）
- タグをタップして /tap に入ると、検証OKの場合のみ /a/[slug] が開く。
- /a/[slug] をURL直打ちしても、cookie無しでは開けない（案内が出る）。
- タップ直後は最新音声が自動再生を試み、失敗したらワンタップで再生できる。
- 投稿者（ログイン済み）が音声をアップロードすると、サイトAの“最新音声”が切り替わる。
- 過去音声はサイトAで選んで再生できる。
- リプレイ：昔コピーした /tap のURL（古いctr）では通らない。
- Signed URLは短寿命で、cookie無しのAPI呼び出しでは発行されない。

# 13. 実装の進め方（タスク分解して進める）
1) Next.js初期化、Supabaseクライアント（anon/service）設定
2) DB migration作成 + tags/audios作成 + triggers
3) Auth（/studio/login）と tags CRUD（作成・一覧・詳細）
4) 音声アップロード（init→upload→commit）
5) サイトA（/a/[slug]）UI + 自動再生フォールバック
6) Signed URL発行API + サイトA再生
7) /tap のcookie/JWT実装（まずDEV_TAPで仮実装）
8) SDM verify 実装を追加して本番タップに置換
9) ctrリプレイ防止 + tap_eventsログ
10) README整備、デプロイ手順

# 14. コード品質要件
- すべてTypeScript
- zodでAPI入力バリデーション
- エラーハンドリング：ユーザー向けメッセージと開発者ログを分ける
- セキュリティ：service roleは絶対にクライアントへ渡さない
- 重要ロジック（verifySdm / cookie検証 / replay判定）はユニットテストを追加（最低限）

以上を満たす実装を生成してください。まずはリポジトリ構成と主要ファイル（API routes、ページ、Supabaseクライアント、SDM検証モジュール、SQL migration、README）を作り、ローカルで動く形にしてください。
