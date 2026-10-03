import { configured, pipeline } from './_redis.js'

const KEY = 'meomchum:log'
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '')
const list = (v, n) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 8).map((x) => x.slice(0, n)) : [])

// 랜딩에서 오는 방문·클릭(event)과 설문(signup)을 한 줄씩 쌓아요
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!configured()) return res.status(503).json({ error: 'storage_not_configured' })
  let b = req.body
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b)
    } catch {
      return res.status(400).json({ error: 'bad_json' })
    }
  }
  if (!b || (b.type !== 'event' && b.type !== 'signup')) return res.status(400).json({ error: 'bad_type' })

  const base = {
    type: b.type,
    at: new Date().toISOString(),
    source: str(b.source, 60),
    campaign: str(b.campaign, 60),
    sid: str(b.sid, 20),
  }
  const row =
    b.type === 'event'
      ? { ...base, name: str(b.name, 30) }
      : {
          ...base,
          stage: str(b.stage, 20),
          trigger: list(b.trigger, 20),
          feature: str(b.feature, 20),
          price: [0, 4900, 9900, 14900].includes(Number(b.price)) ? Number(b.price) : null,
          contact: str(b.contact, 60),
          comment: str(b.comment, 300),
        }

  try {
    await pipeline([['LPUSH', KEY, JSON.stringify(row)], ['LTRIM', KEY, '0', '19999']])
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(502).json({ error: 'storage_failed' })
  }
}
