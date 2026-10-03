import { useEffect, useState } from 'react'
import { Icon, Plant, hush, speak } from '../components'
import { PLEDGES } from '../data'
import { stats, useStore } from '../store'

// 위험한 시간 30분 전, AI가 먼저 거는 전화 (프로토타입: 앱 안에서 체험)
export default function Call({ onClose }: { onClose: () => void }) {
  const { s, d } = useStore()
  const st = stats(s)
  const [phase, setPhase] = useState<'ring' | 'talk' | 'done'>('ring')
  const [shown, setShown] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sec, setSec] = useState(0)
  const hour = st.riskHour === 0 ? '자정' : `밤 ${st.riskHour - 12}시`

  const lines = [
    `${s.name}님, 멈춤이에요. 곧 ${hour}예요.`,
    st.topAteWhy
      ? `지난 기록을 보면 ${s.target}을 드신 날은 ${st.topAteWhy === '피곤함' ? '피곤한' : st.topAteWhy === '스트레스' ? '스트레스 받은' : st.topAteWhy === '심심함' ? '심심한' : '배고픈'} 날 이맘때가 많았어요.`
      : `이 시간이 가장 먹고 싶어지는 때라고 하셨죠.`,
    `오늘 밤 먹고 싶어지면 어떻게 할지, 하나만 정해 둘까요?`,
  ]

  useEffect(() => {
    if (phase !== 'talk') return
    const t = setInterval(() => setSec((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'talk') return
    speak(lines.join(' '), s.voiceOn)
    let i = 0
    const t = setInterval(() => {
      i += 1
      setShown(i)
      if (i >= lines.length) clearInterval(t)
    }, 1300)
    setShown(0)
    return () => {
      clearInterval(t)
      hush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const pick = (p: string) => {
    setAnswer(p)
    d({ t: 'set', patch: { pledge: p } })
    speak(`좋아요. 먹고 싶으면 ${p}. 그 순간에 다시 보여 드릴게요. 편히 쉬세요.`, s.voiceOn)
    setPhase('done')
  }

  const mm = Math.floor(sec / 60)
  const ss = String(sec % 60).padStart(2, '0')

  if (phase === 'ring')
    return (
      <div className="call ring">
        <span className="call__meta">멈춤 · 오늘 밤 체크인</span>
        <div className="orb pulse" aria-hidden="true">
          <Plant days={st.streak} size={70} />
        </div>
        <b className="call__name">멈춤 AI</b>
        <span className="call__meta">1분이면 끝나요</span>
        <div className="ring__row">
          <span className="ring__col">
            <button type="button" className="ring__btn no" onClick={onClose} aria-label="거절">
              <Icon name="phone" size={28} />
            </button>
            거절
          </span>
          <span className="ring__col">
            <button type="button" className="ring__btn yes" onClick={() => setPhase('talk')} aria-label="받기">
              <Icon name="phone" size={28} />
            </button>
            받기
          </span>
        </div>
      </div>
    )

  return (
    <div className="call">
      <div className="call__head">
        <div className="orb" aria-hidden="true">
          <Plant days={st.streak} size={52} />
        </div>
        <b className="call__name">멈춤 AI</b>
        <span className="call__meta">{phase === 'done' ? '통화 끝' : `통화 중 · ${mm}:${ss}`}</span>
      </div>
      <div className="log" aria-live="polite">
        {lines.slice(0, Math.max(1, shown)).map((l, i) => (
          <div key={i} className="bubble ai">
            {l}
          </div>
        ))}
        {answer && (
          <>
            <div className="bubble me">{answer}</div>
            <div className="bubble ai">좋아요. 먹고 싶은 순간에 이 약속을 다시 보여 드릴게요. 편히 쉬세요.</div>
          </>
        )}
      </div>
      {phase === 'talk' && shown >= lines.length && (
        <div className="chips">
          {PLEDGES.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => pick(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
      {phase === 'talk' && <span className="call__meta">실제 서비스에서는 말로 답해요 · 체험에서는 눌러서 답해요</span>}
      <button type="button" className={`btn ${phase === 'done' ? 'calm' : 'end-call'}`} onClick={onClose}>
        {phase === 'done' ? '통화 끝내기' : '끊기'}
      </button>
    </div>
  )
}
