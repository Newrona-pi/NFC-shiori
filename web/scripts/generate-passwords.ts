/**
 * 100個のランダムパスワードを生成し、Supabase tags テーブルに挿入するスクリプト。
 * 結果は passwords.csv に出力される。
 *
 * 使い方:
 *   npx tsx scripts/generate-passwords.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createHash, randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const TOTAL = 100
const PASSWORD_LENGTH = 10
// 紛らわしい文字 (0/O, 1/l/I) を除外
const CHARSET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generatePassword(): string {
  const bytes = randomBytes(PASSWORD_LENGTH)
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('')
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  type Row = { number: number; password: string; slug: string }
  const rows: Row[] = []
  const slugSet = new Set<string>()

  // パスワード生成（slug の重複チェック付き）
  while (rows.length < TOTAL) {
    const password = generatePassword()
    const hash = sha256(password)
    const slug = hash.slice(0, 16)

    if (slugSet.has(slug)) continue // slug 衝突時はリトライ
    slugSet.add(slug)

    rows.push({ number: rows.length + 1, password, slug })
  }

  // DB に一括挿入
  const insertData = rows.map((r) => ({
    slug: r.slug,
    password_hash: sha256(r.password),
    display_name: `チャンネル ${String(r.number).padStart(3, '0')}`,
  }))

  const { error } = await supabase.from('tags').insert(insertData)

  if (error) {
    console.error('DB insert error:', error)
    process.exit(1)
  }

  // CSV 出力
  const csvLines = ['番号,パスワード,slug']
  for (const r of rows) {
    csvLines.push(`${r.number},${r.password},${r.slug}`)
  }

  const csvPath = resolve(process.cwd(), 'passwords.csv')
  writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf-8')

  console.log(`✓ ${TOTAL} 件のパスワードを生成し、DB に挿入しました。`)
  console.log(`✓ CSV を出力しました: ${csvPath}`)
}

main()
