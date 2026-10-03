import { configured, pipeline } from './_redis.js'

// 결과 보기: /api/results?key=관리자키  (CSV: &format=csv)
export default async function handler(req, res) {
  const key = process.env.ADMIN_KEY
  if (!key || req.query.key !== key) return res.status(401).json({ error: 'unauthorized' })
  if (!configured()) return res.status(503).json({ error: 'storage_not_configured' })

  const [{ result }] = await pipeline([['LRANGE', 'meomchum:log', '0', '19999']])
  const rows = (result || []).map((s) => {
    try {
      return JSON.parse(s)
    } catch {
      return null
    }
  }).filter(Boolean)

  const signups = rows.filter((r) => r.type === 'signup')
  const events = rows.filter((r) => r.type === 'event')

  if (req.query.format === 'csv') {
    const cols = ['at', 'source', 'campaign', 'stage', 'trigger', 'feature', 'price', 'contact', 'comment']
    const esc = (v) => `"${String(Array.isArray(v) ? v.join('|') : v ?? '').replace(/"/g, '""')}"`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    return res.status(200).send('﻿' + [cols.join(','), ...signups.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n'))
  }

  const count = (arr, f) => arr.reduce((m, r) => {
    ;[].concat(f(r)).forEach((v) => {
      if (v === undefined || v === null || v === '') return
      m[v] = (m[v] || 0) + 1
    })
    return m
  }, {})
  const visitors = new Set(events.filter((e) => e.name === 'view').map((e) => e.sid)).size
  const paying = signups.filter((r) => r.price > 0).length

  return res.status(200).json({
    visitors,
    views: events.filter((e) => e.name === 'view').length,
    signups: signups.length,
    conversion: visitors ? +(signups.length / visitors).toFixed(3) : 0,
    willingToPay: signups.length ? +(paying / signups.length).toFixed(3) : 0,
    contacts: signups.filter((r) => r.contact).length,
    price: count(signups, (r) => r.price),
    stage: count(signups, (r) => r.stage),
    trigger: count(signups, (r) => r.trigger),
    feature: count(signups, (r) => r.feature),
    bySource: { visitors: count(events.filter((e) => e.name === 'view'), (r) => r.source), signups: count(signups, (r) => r.source) },
    clicks: count(events.filter((e) => e.name !== 'view'), (r) => r.name),
    comments: signups.filter((r) => r.comment).map((r) => ({ at: r.at, price: r.price, comment: r.comment })),
  })
}
