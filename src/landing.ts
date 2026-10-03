import './landing.css'

// 랜딩: 1분 설문을 /api/signup 으로 보내요. 어디서 왔는지(utm)와 방문·클릭도 함께 셉니다.
const params = new URLSearchParams(location.search)
const source = params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'direct')
const campaign = params.get('utm_campaign') || ''
const sid = (() => {
  try {
    const k = 'meomchum-sid'
    const v = localStorage.getItem(k) || Math.random().toString(36).slice(2, 10)
    localStorage.setItem(k, v)
    return v
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
})()

function send(body: Record<string, unknown>) {
  return fetch('/api/signup', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, source, campaign, sid, at: new Date().toISOString() }),
  })
}
const track = (name: string) => send({ type: 'event', name }).catch(() => {})

track('view')
document.querySelectorAll<HTMLElement>('[data-track]').forEach((el) => el.addEventListener('click', () => track(el.dataset.track!)))

// ── 선택지 ──
const picked: Record<string, string[]> = {}
document.querySelectorAll<HTMLElement>('[data-name]').forEach((group) => {
  const name = group.dataset.name!
  const multi = group.dataset.multi === '1'
  picked[name] = []
  group.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.setAttribute('aria-pressed', 'false')
    b.addEventListener('click', () => {
      const v = b.dataset.v!
      if (multi) picked[name] = picked[name].includes(v) ? picked[name].filter((x) => x !== v) : [...picked[name], v]
      else picked[name] = [v]
      group.querySelectorAll<HTMLButtonElement>('button').forEach((x) => x.setAttribute('aria-pressed', String(picked[name].includes(x.dataset.v!))))
      if (name === 'price') track('price_' + v)
    })
  })
})

// ── 제출 ──
const form = document.getElementById('form') as HTMLFormElement
const error = document.getElementById('error')!
const done = document.getElementById('done')!
const submit = document.getElementById('submit') as HTMLButtonElement
const showError = (m: string) => {
  error.textContent = m
  error.hidden = false
}

try {
  if (localStorage.getItem('meomchum-applied')) {
    form.hidden = true
    done.hidden = false
  }
} catch {
  /* 저장소를 못 쓰면 그냥 폼을 보여 줘요 */
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  error.hidden = true
  const contact = (document.getElementById('contact') as HTMLInputElement).value.trim()
  const agree = (document.getElementById('agree') as HTMLInputElement).checked
  const comment = (document.getElementById('comment') as HTMLTextAreaElement).value.trim()
  if (!picked.stage.length) return showError('1번에서 지금 상태를 하나 골라 주세요.')
  if (!picked.price.length) return showError('4번에서 얼마면 쓸지 하나 골라 주세요.')
  if (contact && !agree) return showError('연락처를 남기시려면 동의에 체크해 주세요. 원하지 않으면 연락처 칸을 비워 주세요.')

  submit.disabled = true
  submit.textContent = '보내는 중…'
  try {
    const r = await send({
      type: 'signup',
      stage: picked.stage[0],
      trigger: picked.trigger,
      feature: picked.feature[0] || '',
      price: Number(picked.price[0]),
      contact: agree ? contact : '',
      comment,
    })
    if (!r.ok) throw new Error(String(r.status))
    try {
      localStorage.setItem('meomchum-applied', '1')
    } catch {
      /* ignore */
    }
    form.hidden = true
    done.hidden = false
    done.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } catch {
    showError('보내지 못했어요. 잠시 뒤 다시 눌러 주세요.')
    submit.disabled = false
    submit.textContent = '사전 신청하기'
  }
})
