import { useEffect, useRef, useState, type ReactNode } from 'react'

// ── AI 목소리 (브라우저 음성 합성) ──
export function speak(text: string, on: boolean) {
  if (!on || !('speechSynthesis' in window)) return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'
    u.rate = 1.02
    speechSynthesis.speak(u)
  } catch {
    /* 음성 합성을 못 쓰면 화면 글자만 */
  }
}
export const hush = () => {
  try {
    speechSynthesis.cancel()
  } catch {
    /* ignore */
  }
}

export function Chips<T extends string>({
  options,
  value,
  onPick,
  multi,
}: {
  options: readonly T[]
  value: T | T[] | null
  onPick: (v: T) => void
  multi?: boolean
}) {
  const on = (o: T) => (multi ? (value as T[]).includes(o) : value === o)
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o} type="button" className="chip" aria-pressed={on(o)} onClick={() => onPick(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

export function Scale({ value, onPick, label }: { value: number | null; onPick: (n: number) => void; label: string }) {
  return (
    <div className="q">
      <b>{label}</b>
      <div className="scale" role="group" aria-label={label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={n >= 8 ? 'hi' : undefined} aria-pressed={value === n} onClick={() => onPick(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="legend">
        <span>살짝</span>
        <span>참기 힘듦</span>
      </div>
    </div>
  )
}

export function Breath({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (left <= 0) done.current()
  }, [left])
  const phase = (seconds - left) % 10 < 4 ? '들이쉬고' : '내쉬고'
  return (
    <div className="breath" aria-live="polite">
      <div>
        <b>{Math.max(0, left)}</b>
        <small>{phase}</small>
      </div>
    </div>
  )
}

export function CountUp({ to, unit = '', ms = 900 }: { to: number; unit?: string; ms?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return (
    <>
      {v.toLocaleString('ko-KR')}
      {unit}
    </>
  )
}

// ── 먹은 뒤 내 목소리 녹음 (최대 10초) ──
export function Recorder({ value, onChange }: { value?: string; onChange: (dataUrl: string | undefined) => void }) {
  const [state, setState] = useState<'idle' | 'rec' | 'blocked'>('idle')
  const [left, setLeft] = useState(10)
  const rec = useRef<MediaRecorder | null>(null)
  const timer = useRef<number>(0)

  const stop = () => {
    clearInterval(timer.current)
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop()
  }
  useEffect(() => () => stop(), [])

  const start = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('no-mic')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' })
        const fr = new FileReader()
        fr.onload = () => onChange(String(fr.result))
        fr.readAsDataURL(blob)
        setState('idle')
      }
      rec.current = r
      r.start()
      setState('rec')
      setLeft(10)
      timer.current = window.setInterval(() => {
        setLeft((l) => {
          if (l <= 1) stop()
          return l - 1
        })
      }, 1000)
    } catch {
      setState('blocked')
    }
  }

  if (state === 'blocked')
    return <p className="hint">이 화면에서는 마이크를 쓸 수 없어요. 아래에 글로 남겨 주세요.</p>
  return (
    <div className="rec">
      {state === 'rec' ? (
        <button type="button" className="rec__btn is-on" onClick={stop}>
          <span className="rec__dot" aria-hidden="true" /> 녹음 중 · {left}초 · 누르면 끝
        </button>
      ) : (
        <button type="button" className="rec__btn" onClick={start}>
          <span className="rec__dot" aria-hidden="true" /> {value ? '다시 녹음하기' : '내 목소리로 남기기 (10초)'}
        </button>
      )}
      {value && state !== 'rec' && (
        <div className="rec__row">
          <audio controls src={value} />
          <button type="button" className="link" onClick={() => onChange(undefined)}>
            지우기
          </button>
        </div>
      )}
    </div>
  )
}

export function Top({ title, onClose, step }: { title: string; onClose: () => void; step?: string }) {
  return (
    <div className="top">
      <span className="eyebrow">
        {title}
        {step ? ` · ${step}` : ''}
      </span>
      <button type="button" className="x" onClick={onClose} aria-label="닫기">
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

export function Card({ children, tone }: { children: ReactNode; tone?: 'accent' | 'calm' }) {
  return <div className={`card${tone ? ' card--' + tone : ''}`}>{children}</div>
}

// ── 아이콘 (선 아이콘, currentColor) ──
const P: Record<string, string> = {
  sun: 'M12 4v2M12 18v2M4 12H2M22 12h-2M6 6 4.6 4.6M19.4 19.4 18 18M6 18l-1.4 1.4M19.4 4.6 18 6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  jar: 'M8 3h8M7 6h10l-1 2a6 6 0 0 1 2 4.5V18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-5.5A6 6 0 0 1 8 8z M9 13h6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  bag: 'M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
  pause: 'M9 7v10M15 7v10',
  leaf: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l6-6',
  chev: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  camera: 'M4 8h3l2-2h6l2 2h3v11H4zM12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  wave: 'M3 12h2M7 9v6M11 6v12M15 9v6M19 11v2',
}
export function Icon({ name, size = 20 }: { name: keyof typeof P | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}

// ── 지키고 싶은 내 사진: 기기 안에서만 줄여서 저장 ──
export function PhotoPick({ value, note, onChange }: { value?: string; note?: string; onChange: (photo: string | undefined, note?: string) => void }) {
  const pick = (file?: File) => {
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 720
      const r = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * r)
      c.height = Math.round(img.height * r)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      onChange(c.toDataURL('image/jpeg', 0.78), note)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }
  return (
    <div className="stack">
      <div className="photo-pick">
        {value ? <img src={value} alt="지키고 싶은 내 사진" /> : <span className="ph"><Icon name="camera" size={24} /></span>}
        <div>
          <b>지키고 싶은 나</b>
          <span className="hint">감량에 성공했던 날, 좋아하는 옷을 입은 날의 사진</span>
          <label>
            {value ? '사진 바꾸기' : '사진 고르기'}
            <input id="photo" type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      {value && (
        <input
          id="photo-note"
          className="line"
          value={note ?? ''}
          maxLength={30}
          placeholder="한 줄 남기기 (예: 약 끊던 날, 64.9kg)"
          onChange={(e) => onChange(value, e.target.value)}
        />
      )}
      <span className="hint">사진은 이 휴대폰 안에만 저장되고 어디에도 올라가지 않아요.</span>
    </div>
  )
}

export function Keeper({ photo, note, title }: { photo: string; note?: string; title: string }) {
  return (
    <>
      <figure className="keeper">
        <img src={photo} alt="지키고 싶은 내 사진" />
        <figcaption>
          <small>{note || '지키고 싶은 나'}</small>
        </figcaption>
      </figure>
      <p className="keeper-line">{title}</p>
    </>
  )
}

// ── 손그림 화분: 멈춘 날만큼 자라요 (Forest 참고) ──
export const plantStage = (days: number) => (days >= 15 ? 4 : days >= 8 ? 3 : days >= 4 ? 2 : days >= 1 ? 1 : 0)
export function Plant({ days, size = 110, sleepy }: { days: number; size?: number; sleepy?: boolean }) {
  const st = plantStage(days)
  const stem = [10, 22, 34, 46, 52][st]
  const top = 80 - stem
  const leaf = (y: number, side: 1 | -1, s = 1, key = '') => (
    <path
      key={key}
      className="leaf"
      d={`M50 ${y} c ${side * 6 * s} ${-8 * s}, ${side * 18 * s} ${-9 * s}, ${side * 22 * s} ${-2 * s} c ${-side * 6 * s} ${8 * s}, ${-side * 16 * s} ${8 * s}, ${-side * 22 * s} ${2 * s}z`}
      fill="#5cbf98"
      stroke="#22252b"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  )
  const leaves: JSX.Element[] = []
  if (st === 0) {
    leaves.push(leaf(top + 2, -1, 0.5, 'a'), leaf(top + 2, 1, 0.5, 'b'))
  } else {
    const pairs = Math.min(st + 1, 4)
    for (let i = 0; i < pairs; i++) {
      const y = 78 - ((i + 1) * stem) / (pairs + 0.6)
      leaves.push(leaf(y, i % 2 ? 1 : -1, 0.75 + i * 0.08, 'l' + i))
    }
  }
  return (
    <svg className="plant" width={size} height={size * 1.2} viewBox="0 0 100 120" role="img" aria-label={`멈춘 날 ${days}일, 화분 ${st + 1}단계`}>
      <path d={`M50 80 C 49 ${80 - stem / 2}, 51 ${80 - stem / 1.5}, 50 ${top}`} fill="none" stroke="#22252b" strokeWidth="2.6" strokeLinecap="round" />
      {leaves}
      {st === 4 && (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="50" cy={top - 7} rx="5.5" ry="8" transform={`rotate(${a} 50 ${top})`} fill="#f3c24f" stroke="#22252b" strokeWidth="2" />
          ))}
          <circle cx="50" cy={top} r="4.5" fill="#ef5b3c" stroke="#22252b" strokeWidth="2" />
        </g>
      )}
      <path d="M21 79.5 q 29 -2.2 58 0.6 l -0.6 8.4 q -28.6 1.6 -56.8 -0.4z" fill="#ef7f5f" stroke="#22252b" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M25.5 88.5 q 24.5 1.6 49 -0.2 l -5.2 25.4 q -19 2 -38.6 0.3z" fill="#f29a7c" stroke="#22252b" strokeWidth="2.4" strokeLinejoin="round" />
      {sleepy ? (
        <>
          <path d="M40 99 q 3 2.4 6 0 M54 99 q 3 2.4 6 0" fill="none" stroke="#22252b" strokeWidth="2" strokeLinecap="round" />
          <text x="72" y="70" fontFamily="Gaegu, cursive" fontSize="14" fontWeight="700" fill="#22252b">z</text>
        </>
      ) : (
        <>
          <circle cx="43" cy="99" r="2.1" fill="#22252b" />
          <circle cx="57" cy="99" r="2.1" fill="#22252b" />
        </>
      )}
      <path d="M46.5 104.5 q 3.5 2.6 7 0" fill="none" stroke="#22252b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="103" r="2.6" fill="#ef5b3c" opacity="0.35" />
      <circle cx="62" cy="103" r="2.6" fill="#ef5b3c" opacity="0.35" />
    </svg>
  )
}
