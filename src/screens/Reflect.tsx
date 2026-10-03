import { useState } from 'react'
import { Chips, Recorder, Top } from '../components'
import { josa } from '../data'
import { useStore } from '../store'

const FEEL = ['훨씬 별로', '조금 별로', '기대만큼', '더 좋았어요'] as const
const BODY = ['배부름', '더부룩함', '후회', '만족', '졸림', '속 쓰림'] as const
const QUICK = ['반만 먹어도 충분했어요', '먹고 나니 잠이 안 와요', '배고픈 게 아니었어요']

// 먹고 30분 뒤: 기대와 실제를 비교해서 내 말로 남겨요
export default function Reflect({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, d } = useStore()
  const ev = s.events.find((e) => e.id === id)
  const [feel, setFeel] = useState<(typeof FEEL)[number] | null>(null)
  const [body, setBody] = useState<string[]>([])
  const [text, setText] = useState('')
  const [voice, setVoice] = useState<string | undefined>()
  const [saved, setSaved] = useState(false)
  if (!ev) return null

  const compose = () => {
    if (text.trim()) return text.trim()
    const a = feel ? (feel === '더 좋았어요' ? '맛있긴 했는데' : feel === '기대만큼' ? '그냥 그랬고' : '기대보다 별로였고') : ''
    const b = body.length ? `${josa(body.join(', '), '이', '가')} 남았어요.` : ''
    return [a, b].filter(Boolean).join(', ') || '먹고 나니 생각보다 별로였어요.'
  }

  if (saved)
    return (
      <div className="view">
        <Top title="저장했어요" onClose={onClose} />
        <h2 className="mid">
          다음에 {josa(ev.food, '이', '가')} 당길 때
          <br />이 말을 들려 드릴게요.
        </h2>
        <div className="quote">
          <small>오늘, {josa(ev.food, '을', '를')} 드시고 직접 남긴 말</small>
          <p>“{ev.note}”</p>
          {ev.voice && <audio controls src={ev.voice} />}
        </div>
        <p className="muted">남이 하는 조언보다 내가 겪은 결과가 더 잘 들려요.</p>
        <div className="stack end">
          <button type="button" className="btn primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    )

  return (
    <div className="view">
      <Top title={`${ev.food} 드신 지 30분`} onClose={onClose} />
      <h2 className="mid">기대만큼 맛있었어요?</h2>
      <Chips options={FEEL} value={feel} onPick={setFeel} />
      <div className="q">
        <b>지금 몸은요? (여러 개)</b>
        <Chips options={BODY} value={body as never} multi onPick={(v) => setBody((b) => (b.includes(v) ? b.filter((x) => x !== v) : [...b, v]))} />
      </div>
      <div className="q">
        <b>다음의 나에게 한 마디</b>
        <Recorder value={voice} onChange={setVoice} />
        <div className="chips">
          {QUICK.map((q) => (
            <button key={q} type="button" className="chip" aria-pressed={text === q} onClick={() => setText(q)}>
              {q}
            </button>
          ))}
        </div>
        <input id="reflect" className="line" value={text} onChange={(e) => setText(e.target.value)} placeholder="직접 적어도 돼요" maxLength={60} />
      </div>
      <div className="stack end">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            d({ t: 'patchEv', id, patch: { note: compose(), voice } })
            setSaved(true)
          }}
        >
          저장하기
        </button>
      </div>
    </div>
  )
}
