import { useState } from 'react'
import { Chips, Icon, PhotoPick, Plant } from '../components'
import { PLEDGES, TARGETS, type Target } from '../data'
import { useStore } from '../store'

const HOURS = ['밤 9시', '밤 10시', '밤 11시', '자정 넘어'] as const
const HOUR_OF: Record<(typeof HOURS)[number], number> = { '밤 9시': 21, '밤 10시': 22, '밤 11시': 23, '자정 넘어': 0 }

export default function Onboarding() {
  const { d } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [target, setTarget] = useState<Target>('야식')
  const [hour, setHour] = useState<(typeof HOURS)[number]>('밤 10시')
  const [pledge, setPledge] = useState(PLEDGES[0])
  const [goal, setGoal] = useState(3)
  const [kg, setKg] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoNote, setPhotoNote] = useState<string | undefined>()

  const finish = () => {
    const w = parseFloat(kg)
    d({
      t: 'set',
      patch: {
        onboarded: true,
        name: name.trim() || '나',
        target,
        riskHour: HOUR_OF[hour],
        pledge,
        goal,
        startedAt: Date.now(),
        photo,
        photoNote,
        weights: !isNaN(w) && w > 30 && w < 200 ? [{ at: Date.now(), kg: w }] : [],
      },
    })
  }

  if (step === 0)
    return (
      <div className="view onboard">
        <div className="art">
          <Plant days={9} size={130} />
          <span className="bubble-note">오늘은 참자!</span>
        </div>
        <h1 className="display">멈춤</h1>
        <p className="lede">참으라고 하지 않아요. 먹고 싶은 마음을 알아차리게 해 드려요.</p>
        <ul className="promise">
          <li>
            <i>
              <Icon name="pause" />
            </i>
            <div>
              <b>배달앱을 여는 순간 멈춰요</b>
              <span>주문 직전에 1분, 숨부터 쉬어요</span>
            </div>
          </li>
          <li>
            <i>
              <Icon name="jar" />
            </i>
            <div>
              <b>참은 만큼 돌려받아요</b>
              <span>치킨 한 마리 = 26,000원 = 0.29kg</span>
            </div>
          </li>
          <li>
            <i>
              <Icon name="wave" />
            </i>
            <div>
              <b>무너지려 할 땐 어제의 내가 말려요</b>
              <span>먹고 난 뒤 남긴 내 목소리를 다시 들려줘요</span>
            </div>
          </li>
        </ul>
        <div className="stack end">
          <button type="button" className="btn primary" onClick={() => setStep(1)}>
            시작하기
          </button>
          <button type="button" className="btn quiet" onClick={() => d({ t: 'demo' })}>
            예시 데이터로 둘러보기
          </button>
        </div>
      </div>
    )

  return (
    <div className="view">
      <div className="progress" aria-label={`${step}/3단계`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="mid">무엇을 멈추고 싶어요?</h2>
          <label className="field">
            <span>뭐라고 불러 드릴까요?</span>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 또는 별명" maxLength={10} />
          </label>
          <Chips options={TARGETS} value={target} onPick={setTarget} />
          <p className="hint">음식은 완전히 끊을 수 없으니, 한 가지 행동만 멈춰요.</p>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="mid">언제 가장 무너져요?</h2>
          <Chips options={HOURS} value={hour} onPick={setHour} />
          <p className="hint">이 시간 30분 전에 AI가 먼저 전화해요.</p>
          <h2 className="mid" style={{ marginTop: 8 }}>
            먹고 싶어지면, 대신 뭘 할까요?
          </h2>
          <Chips options={PLEDGES} value={pledge} onPick={setPledge} />
          <p className="hint">미리 정해 두면 그 순간에 지키기 쉬워져요.</p>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="mid">이번 달 목표</h2>
          <div className="goal">
            <button type="button" className="step-btn" onClick={() => setGoal((g) => Math.max(0, g - 1))} aria-label="줄이기">
              −
            </button>
            <div>
              <b>{goal}번</b>
              <span>이하로만 {target}</span>
            </div>
            <button type="button" className="step-btn" onClick={() => setGoal((g) => Math.min(10, g + 1))} aria-label="늘리기">
              +
            </button>
          </div>
          <p className="hint">0번이 아니어도 괜찮아요. 실수는 실패가 아니에요.</p>
          <label className="field">
            <span>지금 체중 (선택)</span>
            <input id="kg" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))} placeholder="예: 64.9" />
          </label>
          <p className="hint">일주일에 한 번만 물어볼게요. 참은 만큼과 실제 체중을 나란히 보여 드려요.</p>
          <PhotoPick
            value={photo}
            note={photoNote}
            onChange={(p, n) => {
              setPhoto(p)
              setPhotoNote(n)
            }}
          />
        </>
      )}

      <div className="stack end">
        <button type="button" className="btn primary" onClick={() => (step < 3 ? setStep(step + 1) : finish())}>
          {step < 3 ? '다음' : '멈춤 시작하기'}
        </button>
        <button type="button" className="btn quiet" onClick={() => setStep(step - 1)}>
          이전
        </button>
      </div>
    </div>
  )
}
