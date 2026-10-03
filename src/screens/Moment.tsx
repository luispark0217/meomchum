import { useEffect, useMemo, useState } from 'react'
import { Breath, Card, Chips, CountUp, Icon, Keeper, Plant, Scale, Top, hush, speak } from '../components'
import { FOODS, REWARDS, food, josa, toKg, total, won, WHERE, WHY, type FoodKey } from '../data'
import { lastWords, stats, uid, useStore, type Ev } from '../store'

type Step = 'menu' | 'cart' | 'pause' | 'notice' | 'watch' | 'rerate' | 'swap' | 'result' | 'ate'

const clock = (t = Date.now()) => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })

// 배달앱을 열었을 때(체험) 또는 "먹고 싶어요"를 눌렀을 때의 1분
export default function Moment({
  start,
  onClose,
  onReflect,
}: {
  start: 'menu' | 'notice'
  onClose: () => void
  onReflect: (id: string) => void
}) {
  const { s, d } = useStore()
  const [step, setStep] = useState<Step>(start)
  const [k, setK] = useState<FoodKey>('치킨')
  const [where, setWhere] = useState<string | null>(null)
  const [why, setWhy] = useState<string | null>(null)
  const [level, setLevel] = useState<number | null>(null)
  const [level2, setLevel2] = useState<number | null>(null)
  const [ratio, setRatio] = useState(1)
  const [ev, setEv] = useState<Ev | null>(null)
  const [openedAt] = useState(Date.now())
  const f = food(k)
  const words = lastWords(s, k)
  const reward = useMemo(() => REWARDS[Math.floor(Math.random() * REWARDS.length)], [])
  const st = stats(s)

  useEffect(() => () => hush(), [])
  useEffect(() => {
    if (step === 'pause') speak('잠깐. 먹고 싶은 마음이 올라왔네요. 주문 전에 일 분만 같이 볼까요?', s.voiceOn)
    if (step === 'watch')
      speak(
        words?.note ? `천천히 숨 쉬어 보세요. 지난번 ${k} 드시고 하신 말이에요. ${words.note}` : '천천히 숨 쉬어 보세요. 마음이 어떻게 변하는지 지켜볼게요.',
        s.voiceOn && !words?.voice,
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const close = () => {
    hush()
    onClose()
  }

  const commit = (kind: Ev['kind'], r = 1) => {
    const e: Ev = {
      id: uid(),
      at: Date.now(),
      food: k,
      kind,
      level: level ?? undefined,
      level2: level2 ?? undefined,
      why: why ?? undefined,
      saved: kind === 'ate' ? 0 : Math.round((total(f) * r) / 100) * 100,
      kcal: kind === 'ate' ? 0 : Math.round(f.kcal * r),
      reward: kind === 'held' ? `${reward.item} · ${reward.brand}` : undefined,
    }
    d({ t: 'add', ev: e })
    setEv(e)
    return e
  }

  // ── 체험용 배달앱 (실제 앱에서는 진짜 배달앱 위에 끼어들어요) ──
  if (step === 'menu')
    return (
      <div className="dl">
        <div className="dl__bar">
          <button type="button" className="link" onClick={close}>
            ← 멈춤으로
          </button>
          <b>배달앱 (체험)</b>
          <span />
        </div>
        <div className="dl__search">야식 찾고 계세요?</div>
        <p className="dl__note">체험용 가게예요. 실제 앱에서는 배달앱을 여는 순간 멈춤이 끼어들어요.</p>
        <div className="dl__list">
          {FOODS.map((x) => (
            <button
              key={x.key}
              type="button"
              className="dl__item"
              onClick={() => {
                setK(x.key)
                setStep('cart')
              }}
            >
              <span className="dl__pic" style={{ background: x.tint }}>
                {x.key}
              </span>
              <span className="dl__txt">
                <b>{x.menu}</b>
                <span>
                  {won(x.price)} · 배달팁 {won(x.tip)}
                </span>
                <em>지금 주문하면 25분</em>
              </span>
            </button>
          ))}
        </div>
      </div>
    )

  if (step === 'cart')
    return (
      <div className="dl">
        <div className="dl__bar">
          <button type="button" className="link" onClick={() => setStep('menu')}>
            ← 가게
          </button>
          <b>장바구니</b>
          <span />
        </div>
        <div className="dl__hero" style={{ background: f.tint }}>
          {k}
        </div>
        <div className="dl__row">
          <span>{f.menu}</span>
          <span>{won(f.price)}</span>
        </div>
        <div className="dl__row">
          <span>배달팁</span>
          <span>{won(f.tip)}</span>
        </div>
        <button type="button" className="dl__order" onClick={() => setStep('pause')}>
          {won(total(f))} 주문하기
        </button>
      </div>
    )

  if (step === 'pause') {
    const weekly = toKg(f.kcal * 2 * 13)
    return (
      <div className="view pause">
        <div className="row-between">
          <span className="auto">자동으로 기록했어요 · {clock(openedAt)}</span>
          <button type="button" className="x" onClick={close} aria-label="닫기">
            <Icon name="close" size={16} />
          </button>
        </div>
        <p className="display">잠깐.</p>
        <p className="mid light">
          {josa(k, '이', '가')} 먹고 싶은 마음이 올라왔네요.
          <br />
          주문 전에 1분만 같이 볼까요?
        </p>
        {s.photo && <Keeper photo={s.photo} note={s.photoNote} title="이 사람을 지키려고 여기까지 왔어요." />}
        <div className="forecast">
          <Icon name="wave" size={22} />
          <span>
            이게 일주일에 두 번이 되면 석 달 뒤 <b>+{weekly.toFixed(1)}kg</b> (환산)
          </span>
        </div>
        <div className="pledge">
          <Icon name="leaf" size={18} />
          <span>
            미리 정한 약속 · <b>{s.pledge}</b>
          </span>
        </div>
        <div className="stack end">
          <button type="button" className="btn primary" onClick={() => setStep('notice')}>
            1분 들여다보기
          </button>
          <button type="button" className="btn quiet" onClick={() => setStep('ate')}>
            그냥 주문할게요 · {won(total(f))}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'notice')
    return (
      <div className="view">
        <Top title="알아차리기" step="1/2" onClose={close} />
        {start === 'notice' && (
          <div className="q">
            <b>지금 먹고 싶은 건</b>
            <Chips options={FOODS.map((x) => x.key)} value={k} onPick={setK} />
          </div>
        )}
        <h2 className="mid">
          {josa(k, '이', '가')} 먹고 싶은 마음을
          <br />
          잠깐 들여다볼게요.
        </h2>
        <div className="q">
          <b>이 마음이 몸 어디에 있어요?</b>
          <Chips options={WHERE} value={where as never} onPick={setWhere} />
        </div>
        <Scale label="얼마나 강해요?" value={level} onPick={setLevel} />
        <div className="q">
          <b>진짜 배고픔이에요?</b>
          <Chips options={WHY} value={why as never} onPick={setWhy} />
        </div>
        <div className="stack end">
          <button type="button" className="btn primary" disabled={!level} onClick={() => setStep('watch')}>
            1분 지켜보기
          </button>
        </div>
      </div>
    )

  if (step === 'watch') {
    const tip =
      why === '피곤함'
        ? '피곤해서 오는 배고픔일 수 있어요. 오늘은 일찍 자는 게 가장 좋은 절제예요.'
        : why === '심심함'
          ? '심심할 때의 배고픔은 배가 아니라 머리가 보내는 신호예요.'
          : why === '스트레스'
            ? '먹고 싶은 게 아니라 쉬고 싶은 걸 수도 있어요.'
            : ''
    return (
      <div className="view">
        <Top title="지켜보기" onClose={close} />
        <Breath seconds={60} onDone={() => setStep('rerate')} />
        <p className="center muted">원이 커질 때 들이쉬고, 작아질 때 내쉬어요.</p>
        {words && (
          <div className="quote">
            <small>
              {new Date(words.at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}, {josa(k, '을', '를')} 드시고 직접 남긴 말
            </small>
            {words.note && <p>“{words.note}”</p>}
            {words.voice && <audio controls autoPlay src={words.voice} />}
          </div>
        )}
        {!words && s.photo && <Keeper photo={s.photo} note={s.photoNote} title="1분만 이 사람 편이 되어 주세요." />}
        {tip && (
          <div className="pledge">
            <Icon name="leaf" size={18} />
            <span>{tip}</span>
          </div>
        )}
        <div className="stack end">
          <button type="button" className="btn quiet" onClick={() => setStep('rerate')}>
            건너뛰기
          </button>
        </div>
      </div>
    )
  }

  if (step === 'rerate')
    return (
      <div className="view">
        <Top title="알아차리기" step="2/2" onClose={close} />
        <h2 className="mid">지금은 얼마나 강해요?</h2>
        <Scale label="1분 뒤 강도" value={level2} onPick={setLevel2} />
        {level2 != null && level != null && (
          <>
            <div className="delta">
              <span>{level}</span>
              <i>→</i>
              <span className="to">{level2}</span>
            </div>
            <p className="center">
              {level2 < level ? (
                <>
                  1분 만에 <b>{level - level2}만큼</b> 내려갔어요. 참은 게 아니라 지나간 거예요.
                </>
              ) : (
                '아직 강하네요. 괜찮아요, 아래에서 고르기만 하면 돼요.'
              )}
            </p>
            <div className="stack end">
              <button
                type="button"
                className="btn calm"
                onClick={() => {
                  commit('held')
                  setRatio(1)
                  setStep('result')
                }}
              >
                지나갔어요
              </button>
              <button type="button" className="btn" onClick={() => setStep('swap')}>
                반만 · 가볍게 바꿔 먹기
              </button>
              <button type="button" className="btn quiet" onClick={() => setStep('ate')}>
                그래도 먹을래요
              </button>
            </div>
          </>
        )}
      </div>
    )

  if (step === 'swap')
    return (
      <div className="view">
        <Top title="바꿔 먹기" onClose={close} />
        <h2 className="mid">완전히 참기 어려운 날도 있어요.</h2>
        <p className="muted">이 중에 고르면 그만큼은 지킨 거예요.</p>
        <div className="stack">
          {[
            { r: 0.5, t: `${k} 반만 먹기` },
            { r: 0.75, t: '가벼운 메뉴로 바꾸기' },
          ].map((o) => (
            <button
              key={o.r}
              type="button"
              className="btn"
              onClick={() => {
                commit('swap', o.r)
                setRatio(o.r)
                setStep('result')
              }}
            >
              {o.t} · {Math.round(f.kcal * o.r).toLocaleString('ko-KR')}kcal 줄이기
            </button>
          ))}
        </div>
        <div className="stack end">
          <button type="button" className="btn quiet" onClick={() => setStep('rerate')}>
            돌아가기
          </button>
        </div>
      </div>
    )

  if (step === 'result' && ev) {
    const after = stats(s)
    const guarantee = Math.min(1, after.monthSaved / 9900)
    return (
      <div className="view">
        <Top title={ratio < 1 ? '바꿔 먹기' : '지나갔어요'} step={clock(ev.at)} onClose={close} />
        <h2 className="display sm">{ratio < 1 ? '절반 넘게 지켰어요.' : '오늘 밤도 멈췄어요.'}</h2>
        <div className="watered">
          <Plant days={after.streak + 1} size={54} />
          <span>화분에 물 줬어요. 오늘 밤 잘 넘기면 {after.streak + 1}일째!</span>
        </div>
        <div className="receipt" aria-label="주문하지 않은 영수증">
          <h3>주문하지 않은 영수증</h3>
          <span className="sub-r">{new Date(ev.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · 멈춤</span>
          <span className="stamp">{ratio < 1 ? '절반 취소' : '주문 취소'}</span>
          <hr />
          <div className="row">
            <span>{f.menu}{ratio < 1 ? ` × ${ratio === 0.5 ? '½' : '¾'}` : ''}</span>
            <span>{won(Math.round((f.price * ratio) / 100) * 100)}</span>
          </div>
          <div className="row">
            <span>배달팁</span>
            <span>{won(Math.round((f.tip * ratio) / 100) * 100)}</span>
          </div>
          <hr />
          <div className="row sum">
            <span>아낀 돈</span>
            <span>
              <CountUp to={ev.saved} unit="원" />
            </span>
          </div>
          <div className="row">
            <span>안 먹은 칼로리</span>
            <span>
              <CountUp to={ev.kcal} unit=" kcal" />
            </span>
          </div>
          <div className="row">
            <span>안 찐 무게 (환산)</span>
            <span>{toKg(ev.kcal).toFixed(2)} kg</span>
          </div>
          {level != null && level2 != null && (
            <div className="row">
              <span>먹고 싶은 마음</span>
              <span>
                {level} → {level2}
              </span>
            </div>
          )}
        </div>

        {ev.reward && (
          <div className="gift">
            <i>
              <Icon name="gift" size={22} />
            </i>
            <div>
              <small>보상 도착 · 배달은 와요, 치킨이 아닐 뿐</small>
              <b>{reward.item}</b>
              <span>
                {reward.brand} · {reward.note} · 기프티콘 (예시)
              </span>
            </div>
          </div>
        )}

        <Card>
          <div className="eyebrow">이번 달 아낀 돈 vs 플러스 구독료</div>
          <div className="meter" aria-label="이번 달 아낀 돈이 구독료의 몇 배인지">
            <span style={{ width: `${guarantee * 100}%` }} />
          </div>
          <div className="row-between">
            <span>
              <b>{won(after.monthSaved)}</b> 아낌
            </span>
            <span className="muted">구독료 9,900원의 {(after.monthSaved / 9900).toFixed(1)}배</span>
          </div>
        </Card>

        <div className="stack end">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              d({ t: 'move', amount: ev.saved })
              close()
            }}
          >
            {won(ev.saved)} 멈춤 통장에 넣기
          </button>
          <button type="button" className="btn quiet" onClick={close}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  // 먹었을 때: 혼내지 않고, 30분 뒤 물어보기
  return (
    <div className="view">
      <Top title="괜찮아요" onClose={close} />
      <h2 className="display sm">맛있게 드세요.</h2>
      <p>혼내지 않을게요. 대신 첫 세 입만 천천히, 맛을 느끼면서 드셔 보세요.</p>
      <Card>
        30분 뒤에 <b>“기대만큼이었나요?”</b> 하나만 여쭤볼게요. 그 대답이 다음번의 나를 도와줘요.
      </Card>
      {st.streak > 0 && <p className="muted">멈춘 날 {st.streak}일 기록은 지우지 않아요. 오늘 하루만 빠질 뿐이에요.</p>}
      <div className="stack end">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            const e = commit('ate')
            onReflect(e.id)
          }}
        >
          30분 뒤로 넘기기 (체험)
        </button>
        <button
          type="button"
          className="btn quiet"
          onClick={() => {
            commit('ate')
            close()
          }}
        >
          나중에 알림으로 받기
        </button>
      </div>
    </div>
  )
}
