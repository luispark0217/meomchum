import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { food, total, type FoodKey, type Target } from './data'

export type Kind = 'held' | 'swap' | 'ate'

export type Ev = {
  id: string
  at: number
  food: FoodKey
  kind: Kind
  level?: number // 처음 강도
  level2?: number // 1분 뒤 강도
  why?: string
  saved: number // 아낀 돈
  kcal: number // 안 먹은 칼로리
  note?: string // 먹은 뒤 내가 남긴 말
  voice?: string // 먹은 뒤 녹음 (data URL)
  reward?: string
}

export type State = {
  v: 1
  onboarded: boolean
  name: string
  target: Target
  riskHour: number
  pledge: string
  goal: number // 이번 달 허용 횟수
  startedAt: number
  weights: { at: number; kg: number }[]
  events: Ev[]
  moved: number // 통장으로 옮긴 금액
  plan: 'free' | 'plus'
  voiceOn: boolean
  photo?: string // 지키고 싶은 내 사진 (작게 줄여서 저장)
  photoNote?: string
}

const DAY = 86400000
const KEY = 'meomchum-state'

export const blank = (): State => ({
  v: 1,
  onboarded: false,
  name: '',
  target: '야식',
  riskHour: 22,
  pledge: '물 한 잔 마시고 양치하기',
  goal: 3,
  startedAt: Date.now(),
  weights: [],
  events: [],
  moved: 0,
  plan: 'free',
  voiceOn: false,
})

// 발표·체험용 예시 데이터: 비만약 끊은 지 4주, 야식 멈춘 지 12일째
export function demo(name = '지은'): State {
  const now = Date.now()
  const at = (daysAgo: number, h: number, m = 0) => {
    const d = new Date(now - daysAgo * DAY)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  }
  const held = (d: number, h: number, k: FoodKey, l: number, l2: number, why: string): Ev => {
    const f = food(k)
    return { id: 'd' + d + h, at: at(d, h, 20), food: k, kind: 'held', level: l, level2: l2, why, saved: total(f), kcal: f.kcal }
  }
  const events: Ev[] = [
    { id: 'a1', at: at(24, 22, 40), food: '치킨', kind: 'ate', level: 9, why: '피곤함', saved: 0, kcal: 0, note: '세 조각부터는 별로였고, 배부르고 후회됐어요.' },
    held(22, 22, '떡볶이', 7, 3, '스트레스'),
    held(20, 21, '치킨', 8, 4, '피곤함'),
    held(18, 23, '디저트', 6, 2, '심심함'),
    { id: 'a2', at: at(13, 22, 10), food: '마라탕', kind: 'ate', level: 8, why: '스트레스', saved: 0, kcal: 0, note: '먹고 나니 속이 쓰려서 잠을 설쳤어요.' },
    held(11, 22, '치킨', 9, 5, '피곤함'),
    held(9, 21, '피자', 7, 3, '심심함'),
    held(7, 22, '마라탕', 8, 4, '스트레스'),
    held(5, 23, '떡볶이', 6, 3, '피곤함'),
    held(3, 22, '족발', 7, 3, '배고픔'),
    held(1, 22, '치킨', 8, 4, '피곤함'),
  ]
  return {
    ...blank(),
    onboarded: true,
    name,
    startedAt: at(26, 9),
    weights: [64.9, 64.7, 64.8, 64.6].map((kg, i) => ({ at: at(26 - i * 7, 8), kg })),
    events,
    moved: 52000,
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s && s.v === 1) return s
    }
  } catch {
    /* 저장소를 못 쓰면 새로 시작 */
  }
  return blank()
}

type Action =
  | { t: 'set'; patch: Partial<State> }
  | { t: 'add'; ev: Ev }
  | { t: 'patchEv'; id: string; patch: Partial<Ev> }
  | { t: 'weight'; kg: number }
  | { t: 'move'; amount: number }
  | { t: 'reset' }
  | { t: 'demo'; name?: string }

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'set':
      return { ...s, ...a.patch }
    case 'add':
      return { ...s, events: [...s.events, a.ev] }
    case 'patchEv':
      return { ...s, events: s.events.map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)) }
    case 'weight':
      return { ...s, weights: [...s.weights, { at: Date.now(), kg: a.kg }] }
    case 'move':
      return { ...s, moved: s.moved + a.amount }
    case 'reset':
      return blank()
    case 'demo':
      return { ...demo(a.name || '지은'), voiceOn: s.voiceOn, photo: s.photo, photoNote: s.photoNote }
  }
}

const Ctx = createContext<{ s: State; d: (a: Action) => void } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch {
      /* 녹음이 많아 용량이 차면 저장만 건너뜀 */
    }
  }, [s])
  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>
}

export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}

// ── 계산 ──
export function stats(s: State) {
  const held = s.events.filter((e) => e.kind !== 'ate')
  const ate = s.events.filter((e) => e.kind === 'ate')
  const saved = held.reduce((a, e) => a + e.saved, 0)
  const kcal = held.reduce((a, e) => a + e.kcal, 0)
  const lastAte = ate.length ? Math.max(...ate.map((e) => e.at)) : s.startedAt
  const streak = Math.max(0, Math.floor((Date.now() - lastAte) / DAY))
  const month = new Date().getMonth()
  const thisMonth = s.events.filter((e) => new Date(e.at).getMonth() === month)
  const monthSaved = thisMonth.filter((e) => e.kind !== 'ate').reduce((a, e) => a + e.saved, 0)
  const monthAte = thisMonth.filter((e) => e.kind === 'ate').length
  const drops = held.filter((e) => e.level != null && e.level2 != null).map((e) => (e.level! - e.level2!) / e.level!)
  const avgDrop = drops.length ? drops.reduce((a, b) => a + b, 0) / drops.length : 0
  // 가장 위험한 시간대
  const hours = new Map<number, number>()
  s.events.forEach((e) => {
    const h = new Date(e.at).getHours()
    hours.set(h, (hours.get(h) || 0) + 1)
  })
  const riskHour = [...hours.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? s.riskHour
  // 먹었을 때 이유
  const ateWhy = new Map<string, number>()
  ate.forEach((e) => e.why && ateWhy.set(e.why, (ateWhy.get(e.why) || 0) + 1))
  const topAteWhy = [...ateWhy.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  return { held, ate, saved, kcal, streak, monthSaved, monthAte, avgDrop, riskHour, topAteWhy, inJar: s.moved, pending: Math.max(0, saved - s.moved) }
}

// 같은 음식을 먹고 남긴 가장 최근의 내 말
export function lastWords(s: State, k: FoodKey) {
  return [...s.events].reverse().find((e) => e.kind === 'ate' && e.food === k && (e.note || e.voice))
}

export const uid = () => Math.random().toString(36).slice(2, 9)
