// Upstash Redis REST (Vercel Marketplace 'Upstash for Redis'가 넣어 주는 환경변수를 그대로 써요)
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

export const configured = () => Boolean(URL_ && TOKEN)

export async function pipeline(cmds) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  })
  if (!r.ok) throw new Error(`redis ${r.status}`)
  return r.json()
}
