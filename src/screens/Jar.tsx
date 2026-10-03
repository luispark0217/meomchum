import { useState } from 'react'
import { Card, Icon, PhotoPick, Top } from '../components'
import { FOODS, PLUS_PRICE, toKg, won } from '../data'
import { stats, useStore } from '../store'
import type { Open } from './Home'

export default function Jar({ open }: { open: Open }) {
  const { s, d } = useStore()
  const st = stats(s)
  const rewards = s.events.filter((e) => e.reward).sort((a, b) => b.at - a.at)
  const [toast, setToast] = useState('')
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  return (
    <div className="view">
      <h2 className="mid">멈춤 통장</h2>
      <div className="jar">
        <small>참아서 모은 돈</small>
        <b>{won(st.inJar)}</b>
        <span>치킨 {Math.floor(st.inJar / 26000)}마리만큼</span>
      </div>
      {st.pending > 0 && (
        <button type="button" className="btn primary" onClick={() => d({ t: 'move', amount: st.pending })}>
          아직 안 넣은 {won(st.pending)} 넣기
        </button>
      )}
      <button type="button" className="btn outline" onClick={() => flash('프로토타입: 실제 서비스에서는 토스·카카오뱅크 이체 화면으로 연결돼요')}>
        <Icon name="chev" size={16} /> 내 은행 계좌로 옮기기
      </button>

      <h3 className="sub">받은 보상</h3>
      {rewards.length === 0 ? (
        <p className="muted small">끝까지 참으면 제휴 브랜드 보상이 와요. 배달은 와요, 치킨이 아닐 뿐.</p>
      ) : (
        <ul className="gifts">
          {rewards.slice(0, 5).map((e) => (
            <li key={e.id}>
              <b>{e.reward}</b>
              <span className="muted">{new Date(e.at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} · {e.food} 참음</span>
            </li>
          ))}
        </ul>
      )}

      <Card tone="accent">
        <div className="eyebrow">멈춤 플러스 · 월 {won(PLUS_PRICE)}</div>
        <p className="small">
          이번 달 아낀 돈 <b>{won(st.monthSaved)}</b> · 구독료의 <b>{(st.monthSaved / PLUS_PRICE).toFixed(1)}배</b>
        </p>
        <button type="button" className="btn primary" onClick={() => open({ type: 'plus' })}>
          {s.plan === 'plus' ? '플러스 이용 중' : '플러스 알아보기'}
        </button>
      </Card>

      <h3 className="sub">설정</h3>
      <div className="settings">
        <PhotoPick value={s.photo} note={s.photoNote} onChange={(photo, photoNote) => d({ t: 'set', patch: { photo, photoNote } })} />
        {s.photo && (
          <button type="button" className="link" onClick={() => d({ t: 'set', patch: { photo: undefined, photoNote: undefined } })}>
            사진 지우기
          </button>
        )}
        <label className="toggle">
          <input id="voice" type="checkbox" checked={s.voiceOn} onChange={(e) => d({ t: 'set', patch: { voiceOn: e.target.checked } })} />
          <span>AI 목소리로 읽어 주기</span>
        </label>
        <button type="button" className="link" onClick={() => d({ t: 'demo', name: s.name })}>
          예시 데이터로 다시 채우기
        </button>
        <button type="button" className="link danger" onClick={() => d({ t: 'reset' })}>
          처음부터 다시 시작
        </button>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

export function Plus({ onClose }: { onClose: () => void }) {
  const { s, d } = useStore()
  const st = stats(s)
  return (
    <div className="view">
      <Top title="멈춤 플러스" onClose={onClose} />
      <h2 className="display sm">아낀 돈이 구독료보다 적으면, 돌려드려요.</h2>
      <p className="muted">치킨 한 번만 참아도 26,000원. 이번 달 이미 {won(st.monthSaved)}을 아꼈어요.</p>
      <div className="plans">
        <div className="plan">
          <b>무료</b>
          <ul>
            <li>배달앱 1개 가로채기</li>
            <li>1분 알아차림 · 숨쉬기</li>
            <li>멈춘 날 · 아낀 돈 · 환산 kg</li>
            <li>참으면 제휴 보상</li>
          </ul>
        </div>
        <div className="plan on">
          <b>플러스 · 월 {won(PLUS_PRICE)}</b>
          <ul>
            <li>배달앱 전부 + 편의점·쇼핑 앱</li>
            <li>위험한 밤 AI가 먼저 전화</li>
            <li>내 목소리 다시 듣기</li>
            <li>패턴 분석 · 실제 체중 연결</li>
          </ul>
        </div>
      </div>
      <div className="stack end">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            d({ t: 'set', patch: { plan: s.plan === 'plus' ? 'free' : 'plus' } })
            onClose()
          }}
        >
          {s.plan === 'plus' ? '무료로 돌아가기 (체험)' : '7일 무료로 써 보기 (체험)'}
        </button>
        <p className="hint center">프로토타입이라 실제 결제는 일어나지 않아요.</p>
      </div>
    </div>
  )
}

export function Wrapped({ onClose }: { onClose: () => void }) {
  const { s } = useStore()
  const st = stats(s)
  const counts = FOODS.map((f) => ({ k: f.key, n: st.held.filter((e) => e.food === f.key).length, tint: f.tint })).filter((x) => x.n > 0)
  const max = Math.max(1, ...counts.map((c) => c.n))
  const [msg, setMsg] = useState('')
  const text = `멈춤으로 참은 음식 ${st.held.length}번 · ${won(st.saved)} 아낌 · 안 찐 무게 ${toKg(st.kcal).toFixed(1)}kg`
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: '내가 참은 음식', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setMsg('문구를 복사했어요')
    } catch {
      setMsg(text)
    }
  }
  return (
    <div className="view">
      <Top title="결산 카드" onClose={onClose} />
      <div className="wrapped">
        <small>{s.name}님이 멈춤과 함께 참은 음식</small>
        <b className="wrapped__big">{st.held.length}번</b>
        <ul>
          {counts.map((c) => (
            <li key={c.k}>
              <span>{c.k}</span>
              <span className="bar">
                <i style={{ width: `${(c.n / max) * 100}%`, background: c.tint }} />
              </span>
              <b>{c.n}</b>
            </li>
          ))}
        </ul>
        <div className="wrapped__foot">
          <span>
            아낀 돈 <b>{won(st.saved)}</b>
          </span>
          <span>
            안 찐 무게 <b>{toKg(st.kcal).toFixed(1)}kg</b>
          </span>
        </div>
      </div>
      <div className="stack end">
        <button type="button" className="btn primary" onClick={share}>
          공유하기
        </button>
        {msg && <p className="hint center">{msg}</p>}
      </div>
    </div>
  )
}
