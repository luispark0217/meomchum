import { useState } from 'react'
import { Card, Icon, Plant } from '../components'
import { num, toKg, won } from '../data'
import { stats, useStore } from '../store'

export type Open = (f: { type: 'order' } | { type: 'sos' } | { type: 'call' } | { type: 'reflect'; id: string } | { type: 'wrapped' } | { type: 'plus' }) => void

const DAY = 86400000

function WeightChart({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null
  const W = 300,
    H = 80
  const min = Math.min(...pts) - 0.4,
    max = Math.max(...pts) + 0.4
  const x = (i: number) => 12 + (i * (W - 24)) / (pts.length - 1)
  const y = (v: number) => H - 10 - ((v - min) / (max - min)) * (H - 28)
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const L = pts.length - 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`체중 ${pts[0]}kg에서 ${pts[L]}kg`}>
      <defs>
        <linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--leaf)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--leaf)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="12" x2={W - 12} y1={y(pts[0])} y2={y(pts[0])} stroke="var(--edge-2)" strokeDasharray="3 4" />
      <path d={`${d} L ${x(L)} ${H} L ${x(0)} ${H} Z`} fill="url(#wfill)" />
      <path d={d} fill="none" stroke="var(--leaf)" strokeWidth="2" />
      <circle cx={x(L)} cy={y(pts[L])} r="4" fill="var(--leaf)" />
      <text x={x(L) - 6} y={y(pts[L]) - 10} textAnchor="end" fontSize="11" fill="var(--ink)" fontFamily="IBM Plex Mono, monospace">
        {pts[L]}kg
      </text>
      <text x="14" y={y(pts[0]) - 7} fontSize="10" fill="var(--muted)">
        시작 {pts[0]}kg
      </text>
    </svg>
  )
}

export default function Home({ open }: { open: Open }) {
  const { s, d } = useStore()
  const st = stats(s)
  const [kg, setKg] = useState('')
  const lastW = s.weights[s.weights.length - 1]
  const needW = !lastW || Date.now() - lastW.at > 6 * DAY
  const hour = s.riskHour === 0 ? '자정' : `밤 ${s.riskHour - 12}시`
  const callAt = s.riskHour === 0 ? '밤 11:30' : `밤 ${s.riskHour - 13}:30`

  // 최근 14일: 먹은 날 / 멈춘 날
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = today.getTime() - (13 - i) * DAY
    const inDay = s.events.filter((e) => e.at >= start && e.at < start + DAY)
    const slip = inDay.some((e) => e.kind === 'ate')
    const before = start + DAY <= s.startedAt
    return { slip, on: !slip && !before && start <= Date.now() }
  })

  return (
    <div className="view home">
      <div className="hello">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
          <b>{s.name}님, 오늘 밤도 같이 버텨요</b>
        </div>
        {s.photo ? <img className="avatar" src={s.photo} alt="" /> : <span className="avatar">{s.name.slice(0, 1)}</span>}
      </div>

      <section className="hero" aria-label="멈춘 날">
        <div className="hero__streak">
          <span className="num">{st.streak}</span>
          <span>일째 {s.target} 멈춤</span>
        </div>
        <div className="hero__plant">
          <Plant days={st.streak} size={96} />
        </div>
        <div className="dots" aria-label="최근 14일">
          {days.map((x, i) => (
            <i key={i} className={x.slip ? 'slip' : x.on ? 'on' : ''} />
          ))}
        </div>
        <p className="hero__line">
          {st.avgDrop > 0 ? (
            <>
              먹고 싶은 마음은 1분 지켜보면 평균 <b>{Math.round(st.avgDrop * 100)}%</b> 내려갔어요.
            </>
          ) : (
            '먹고 싶을 때 아래 버튼을 눌러 보세요. 1분이면 돼요.'
          )}
        </p>
      </section>

      <button type="button" className="sos" onClick={() => open({ type: 'sos' })}>
        <div>
          <b>먹고 싶어요</b>
          <span>먹고 싶으면 → {s.pledge}</span>
        </div>
        <span className="ring" aria-hidden="true">
          <Icon name="pause" size={22} />
        </span>
      </button>

      <button type="button" className="tryout" onClick={() => open({ type: 'order' })}>
        <Icon name="bag" size={22} />
        <span>
          <b>배달앱 열어 보기</b>
          주문 버튼을 누르면 멈춤이 끼어들어요 (체험)
        </span>
      </button>

      <div className="stats">
        <div className="stat">
          <small>아낀 돈</small>
          <b>{won(st.saved)}</b>
        </div>
        <div className="stat">
          <small>참은 횟수</small>
          <b>{st.held.length}회</b>
        </div>
        <div className="stat">
          <small>안 먹은 칼로리</small>
          <b>
            {num(st.kcal)}
            <em> kcal</em>
          </b>
        </div>
        <div className="stat">
          <small>안 찐 무게 (환산)</small>
          <b>{toKg(st.kcal).toFixed(1)}kg</b>
        </div>
      </div>

      <button type="button" className="callcard" onClick={() => open({ type: 'call' })}>
        <span className="orb sm" aria-hidden="true">
          <Plant days={st.streak} size={34} />
        </span>
        <span>
          <b>오늘 {callAt}, 먼저 전화할게요</b>
          <small>{hour}가 가장 위험한 시간이라서요 · 지금 받아 보기</small>
        </span>
        <span className="go">
          <Icon name="chev" />
        </span>
      </button>

      <Card>
        <div className="row-between">
          <span className="eyebrow">실제 체중 · 주 1회</span>
          {s.weights.length >= 2 && <span className="small">환산 {toKg(st.kcal).toFixed(1)}kg 지킴</span>}
        </div>
        <WeightChart pts={s.weights.map((w) => w.kg)} />
        {s.weights.length < 2 && <p className="small">두 번 이상 재면 참은 만큼과 실제 체중을 나란히 보여 드려요.</p>}
        {needW && (
          <div className="inline">
            <input id="weekly-kg" inputMode="decimal" placeholder="이번 주 체중 (kg)" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))} />
            <button
              type="button"
              className="btn sm"
              disabled={!(parseFloat(kg) > 30)}
              onClick={() => {
                d({ t: 'weight', kg: parseFloat(kg) })
                setKg('')
              }}
            >
              기록
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
