import { useState } from 'react'
import { StoreProvider, useStore } from './store'
import { Icon } from './components'
import Onboarding from './screens/Onboarding'
import Home, { type Open } from './screens/Home'
import Log from './screens/Log'
import Jar, { Plus, Wrapped } from './screens/Jar'
import Moment from './screens/Moment'
import Reflect from './screens/Reflect'
import Call from './screens/Call'

type Flow = Parameters<Open>[0] | null
type Tab = 'home' | 'log' | 'jar'

function Shell() {
  const { s } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [flow, setFlow] = useState<Flow>(null)
  const close = () => setFlow(null)

  if (!s.onboarded) return <Onboarding />

  if (flow) {
    if (flow.type === 'order' || flow.type === 'sos')
      return <Moment start={flow.type === 'order' ? 'menu' : 'notice'} onClose={close} onReflect={(id) => setFlow({ type: 'reflect', id })} />
    if (flow.type === 'reflect') return <Reflect id={flow.id} onClose={close} />
    if (flow.type === 'call') return <Call onClose={close} />
    if (flow.type === 'plus') return <Plus onClose={close} />
    if (flow.type === 'wrapped') return <Wrapped onClose={close} />
  }

  return (
    <>
      <main className="main">
        {tab === 'home' && <Home open={setFlow} />}
        {tab === 'log' && <Log open={setFlow} />}
        {tab === 'jar' && <Jar open={setFlow} />}
      </main>
      <nav className="tabs" aria-label="메뉴">
        {(
          [
            ['home', '오늘', 'moon'],
            ['log', '기록', 'list'],
            ['jar', '통장', 'jar'],
          ] as const
        ).map(([k, label, icon]) => (
          <button key={k} type="button" aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            <Icon name={icon} size={22} />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <div className="app">
        <Shell />
      </div>
    </StoreProvider>
  )
}
