import { Card } from '../components'
import { won } from '../data'
import { stats, useStore } from '../store'
import type { Open } from './Home'

const KIND = { held: '참음', swap: '바꿔 먹음', ate: '먹음' } as const

export default function Log({ open }: { open: Open }) {
  const { s } = useStore()
  const st = stats(s)
  const list = [...s.events].sort((a, b) => b.at - a.at)
  const hour = st.riskHour === 0 ? '자정' : `밤 ${st.riskHour > 12 ? st.riskHour - 12 : st.riskHour}시`

  return (
    <div className="view">
      <h2 className="mid">기록</h2>
      <div className="insights">
        <Card>
          <small>가장 위험한 시간</small>
          <b>{hour}쯤</b>
        </Card>
        <Card>
          <small>먹었을 때 주된 이유</small>
          <b>{st.topAteWhy ?? '아직 없음'}</b>
        </Card>
        <Card>
          <small>1분 뒤 갈망</small>
          <b>평균 −{Math.round(st.avgDrop * 100)}%</b>
        </Card>
        <Card>
          <small>이번 달 {s.target}</small>
          <b>
            {st.monthAte}번 / 목표 {s.goal}번
          </b>
        </Card>
      </div>

      <button type="button" className="btn outline" onClick={() => open({ type: 'wrapped' })}>
        내가 참은 음식 결산 카드 보기
      </button>

      {list.length === 0 && <p className="muted">아직 기록이 없어요. 배달앱을 열거나 “먹고 싶어요”를 누르면 여기에 쌓여요.</p>}

      <ul className="events">
        {list.map((e) => (
          <li key={e.id} className={`ev ev--${e.kind}`}>
            <div className="ev__top">
              <span className="pill">{KIND[e.kind]}</span>
              <b>{e.food}</b>
              <span className="muted">
                {new Date(e.at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} {new Date(e.at).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <div className="ev__body">
              {e.level != null && (
                <span>
                  갈망 {e.level}
                  {e.level2 != null ? ` → ${e.level2}` : ''}
                </span>
              )}
              {e.why && <span>{e.why}</span>}
              {e.kind !== 'ate' && <span>{won(e.saved)} 아낌</span>}
            </div>
            {e.note && <p className="ev__note">“{e.note}”</p>}
            {e.voice && <audio controls src={e.voice} />}
            {e.kind === 'ate' && !e.note && !e.voice && (
              <button type="button" className="link" onClick={() => open({ type: 'reflect', id: e.id })}>
                기대만큼이었는지 남기기
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
