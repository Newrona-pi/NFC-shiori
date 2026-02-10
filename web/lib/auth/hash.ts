/** Convert password to URL slug (SHA-256 first 16 hex chars). */
export async function passwordToSlug(password: string): Promise<string> {
  const hash = await passwordToHash(password)
  return hash.slice(0, 16)
}

/** Convert password to full SHA-256 hex string (64 chars, for DB storage). */
export async function passwordToHash(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
