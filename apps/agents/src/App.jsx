import { useCallback, useEffect, useState } from 'react'
import { I18N } from './i18n.js'
import { AGENTS_FALLBACK } from './agentsFallback.js'
import { LUNAR_IMG, REAPER_IMG } from './assets/images.js'
import {
  agentStatus,
  fetchJson,
  fmtDate,
  seenText,
  validAgents,
} from './agentsData.js'
import RanHubCard, { RanHubArc, RanHubInner } from './components/RanHub.jsx'

function tickClock() {
  try {
    return (
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date()) + ' WIB'
    )
  } catch (e) {
    return ''
  }
}

const CARDS = [
  {
    id: 'ran',
    name: 'ran',
    roleKey: 'ag.ran.role',
    descKey: 'ag.ran.desc',
    host: 'Muse',
    detail: 'heartbeat from the Muse VM',
    linked: 'Lunar · Reaper',
    char: 'ran',
  },
  {
    id: 'lunar',
    name: 'Lunar',
    roleKey: 'ag.lunar.role',
    descKey: 'ag.lunar.desc',
    host: 'Tencent · Hermes gateway',
    detail: 'gateway active, 9router active',
    linked: 'ran · Reaper',
    char: 'lunar',
  },
  {
    id: 'hermes2',
    name: 'Reaper',
    roleKey: 'ag.hermes2.role',
    descKey: 'ag.hermes2.desc',
    host: 'Manus sandbox · 15-min health monitor',
    detail: 'gateway + 9router active (checked 2026-11-22 11:43:59 WIB)',
    linked: 'ran · Lunar',
    char: 'hermes2',
  },
]

const FLOW = [
  { n: 'watchers → alerts', t: 'fl1.t', d: 'fl1.d' },
  { n: 'findings ↔ proof', t: 'fl2.t', d: 'fl2.d' },
  { n: 'sync → reports', t: 'fl3.t', d: 'fl3.d' },
]

export default function App() {
  const [lang, setLang] = useState('en')
  const [theme, setTheme] = useState('terminal')
  const [agents, setAgents] = useState(AGENTS_FALLBACK)
  const [live, setLive] = useState(false)
  const [clock, setClock] = useState('--:--:-- WIB')
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const t = (k) => I18N[lang][k]

  useEffect(() => {
    document.documentElement.lang = lang === 'id' ? 'id' : 'en'
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    setClock(tickClock())
    const iv = setInterval(() => setClock(tickClock()), 1000)
    return () => clearInterval(iv)
  }, [])

  const syncAgents = useCallback(() => {
    const steps = [
      { kind: 'url', url: 'status.json' },
      { kind: 'snapshot' },
      { kind: 'url', url: 'https://reaper.my.id/status.json' },
      { kind: 'url', url: 'agents.json' },
      { kind: 'url', url: 'https://reaper.my.id/agents.json' },
    ]
    let i = 0
    const next = () => {
      if (i >= steps.length) return
      const step = steps[i++]
      if (step.kind === 'snapshot') {
        if (!validAgents(AGENTS_FALLBACK)) { next(); return }
        setAgents(AGENTS_FALLBACK)
        return
      }
      fetchJson(step.url)
        .then((j) => {
          if (!validAgents(j)) { next(); return }
          setAgents(j)
          if (step.url === 'status.json' || step.url.indexOf('reaper.my.id') !== -1) setLive(true)
        })
        .catch(() => next())
    }
    next()
  }, [])

  useEffect(() => { syncAgents() }, [syncAgents])

  const agentById = (id) => (agents.agents || []).find((x) => x.id === id) || null
  const nodeClass = (id) => {
    const st = agentStatus(agentById(id))
    return 'mesh-node' + (st === 'online' || st === 'up' ? ' is-online' : st === 'offline' || st === 'down' ? ' is-offline' : '')
  }
  const cardClass = (id) => {
    const st = agentStatus(agentById(id))
    return 'agent-card' + (st === 'online' || st === 'up' ? ' is-online' : st === 'offline' || st === 'down' ? ' is-offline' : '')
  }
  const statusText = (id) => {
    const st = agentStatus(agentById(id))
    if (st === 'online' || st === 'up') return t('ag.online')
    if (st === 'offline' || st === 'down') return t('ag.offline')
    return t('ag.unknown')
  }

  const themeLabel = theme === 'terminal' ? t('theme.paper') : t('theme.term')
  const syncText =
    (live ? t('agents.live') : t('agents.snap')) +
    ' · ' +
    t('data.updated') +
    ' ' +
    (agents.updatedAt ? fmtDate(agents.updatedAt, lang) : '—')

  return (
    <>
      <div className="statusbar">
        <div className="wrap">
          <a className="backlink" href="https://reaper.my.id">
            <span className="arr" aria-hidden="true">←</span>
            <span>{t('bar.back')}</span>
          </a>
          <span className="hide-sm">
            <span className="dot"></span>
            <span>{t('bar.live')}</span>
          </span>
          <span className="hide-sm" id="clock">
            {clock}
          </span>
          <span className="spacer"></span>
          <div className="controls">
            <div className="seg" role="group" aria-label="Language / Bahasa">
              <button id="lang-en" aria-pressed={lang === 'en' ? 'true' : 'false'} onClick={() => setLang('en')}>
                EN
              </button>
              <button id="lang-id" aria-pressed={lang === 'id' ? 'true' : 'false'} onClick={() => setLang('id')}>
                ID
              </button>
            </div>
            <button
              className="theme-btn"
              id="theme-btn"
              aria-label="Toggle theme"
              onClick={() => setTheme((th) => (th === 'terminal' ? 'paper' : 'terminal'))}
            >
              ◐ <span>{themeLabel}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="wrap">
        <header className="hero">
          <p className="role">{t('hero.role')}</p>
          <h1 className="title">
            <span>{t('hero.t1')}</span> <em>{t('hero.t2')}</em>
          </h1>
          <p className="lede" dangerouslySetInnerHTML={{ __html: t('hero.lede') }} />
          <p className="sub" dangerouslySetInnerHTML={{ __html: t('hero.sub') }} />
        </header>

        <section id="mesh" aria-label="Agent mesh">
          <div className="sec-head">
            <span className="no">01</span>
            <h2>{t('mesh.title')}</h2>
            <span className="rule"></span>
          </div>
          <div
            className="mesh"
            role="img"
            aria-label="ran, Lunar and Reaper as connected characters: ran in the centre, linked to Lunar and Reaper, who are also linked to each other"
          >
            <svg className="mesh-svg" viewBox="0 0 960 252" aria-hidden="true">
              <path className="mesh-line" d="M 232 112 L 406 104" />
              <path className="mesh-line" d="M 554 104 L 728 112" />
              <path className="mesh-line mesh-line-arc" d="M 170 168 Q 480 246 790 168" />
              {!reduced && (
                <>
                  <circle r="4" fill="var(--accent)">
                    <animateMotion dur="2.8s" repeatCount="indefinite" path="M 232 112 L 406 104" />
                  </circle>
                  <circle r="4" fill="var(--accent)">
                    <animateMotion dur="2.8s" begin="0.7s" repeatCount="indefinite" path="M 728 112 L 554 104" />
                  </circle>
                  <circle r="3.5" fill="var(--warn)">
                    <animateMotion dur="5s" repeatCount="indefinite" path="M 170 168 Q 480 246 790 168" />
                  </circle>
                </>
              )}
              <text className="mesh-link-label" x="319" y="92" textAnchor="middle">
                watchers → alerts
              </text>
              <text className="mesh-link-label" x="641" y="92" textAnchor="middle">
                sync → reports
              </text>
              <text className="mesh-link-label" x="480" y="238" textAnchor="middle">
                findings ↔ proof
              </text>

              <g className={nodeClass('lunar')} data-agent-node="lunar" transform="translate(170,112)">
                <circle className="halo" r="62" />
                <image href={LUNAR_IMG} x="-48" y="-48" width="96" height="96" />
                <circle className="mesh-status-dot" cx="40" cy="40" r="7.5" stroke="var(--panel)" strokeWidth="3" />
              </g>
              <text className="mesh-name" x="170" y="198" textAnchor="middle">
                Lunar
              </text>
              <text className="mesh-role" x="170" y="218" textAnchor="middle">
                Hermes 1 · the hunter
              </text>

              <g className={nodeClass('ran')} data-agent-node="ran" transform="translate(480,104) scale(1.14)">
                <circle className="halo" r="62" />
                <circle className="badge" r="56" />
                <RanHubInner />
                <RanHubArc />
                <circle className="mesh-status-dot" cx="40" cy="40" r="7.5" stroke="var(--panel)" strokeWidth="3" />
              </g>
              <text className="mesh-name" x="480" y="198" textAnchor="middle">
                ran
              </text>
              <text className="mesh-role" x="480" y="218" textAnchor="middle">
                Muse · the hub
              </text>

              <g className={nodeClass('hermes2')} data-agent-node="hermes2" transform="translate(790,112)">
                <circle className="halo" r="62" />
                <image href={REAPER_IMG} x="-48" y="-48" width="96" height="96" />
                <circle className="mesh-status-dot" cx="40" cy="40" r="7.5" stroke="var(--panel)" strokeWidth="3" />
              </g>
              <text className="mesh-name" x="790" y="198" textAnchor="middle">
                Reaper
              </text>
              <text className="mesh-role" x="790" y="218" textAnchor="middle">
                Hermes 2 · the sandbox
              </text>
            </svg>
          </div>
          <p className="mesh-caption">
            <b>mesh /</b>
            <span dangerouslySetInnerHTML={{ __html: t('mesh.caption') }} />
          </p>
        </section>

        <section id="crew" aria-label="The agents">
          <div className="sec-head">
            <span className="no">02</span>
            <h2>{t('crew.title')}</h2>
            <span className="rule"></span>
          </div>

          <div className="agents-grid" id="agents-grid">
            {CARDS.map((c) => {
              const a = agentById(c.id)
              return (
                <article key={c.id} className={cardClass(c.id)} data-agent={c.id}>
                  {c.char === 'ran' ? (
                    <div className="agent-char" aria-hidden="true">
                      <RanHubCard />
                    </div>
                  ) : (
                    <div className="agent-char agent-char-img">
                      <img
                        src={c.char === 'lunar' ? LUNAR_IMG : REAPER_IMG}
                        alt={
                          c.char === 'lunar'
                            ? 'Lunar character — purple hooded figure with a crescent moon emblem'
                            : 'Reaper character — red horned hooded figure wreathed in flames'
                        }
                      />
                    </div>
                  )}
                  <div className="agent-top">
                    <span className="agent-dot"></span>
                    <h3>{c.name}</h3>
                    <span className="agent-status" data-agent-status>
                      {statusText(c.id)}
                    </span>
                  </div>
                  <p className="agent-role">{t(c.roleKey)}</p>
                  <p className="agent-desc" dangerouslySetInnerHTML={{ __html: t(c.descKey) }} />
                  <div className="agent-meta">
                    <span>
                      <span>{t('ag.host')}</span> · <b>{c.host}</b>
                    </span>
                    <span>
                      <span>{t('ag.seen')}</span> · <b data-agent-seen>{seenText(a, agents.updatedAt, lang)}</b>
                    </span>
                    <span data-agent-detail>{a && a.detail ? a.detail : c.detail}</span>
                  </div>
                  <div className="agent-linked">
                    <span className="arr">⇄</span>
                    <span>{t('ag.linked')}</span>
                    <b>{c.linked}</b>
                  </div>
                </article>
              )
            })}
          </div>

          <div className={'agents-sync' + (live ? ' live' : '')} id="agents-sync">
            <span className="dot"></span>
            <span id="agents-sync-text">{syncText}</span>
            <button id="agents-sync-btn" type="button" onClick={syncAgents}>
              {t('data.refresh')}
            </button>
          </div>
        </section>

        <section id="flow" aria-label="How they work together">
          <div className="sec-head">
            <span className="no">03</span>
            <h2>{t('flow.title')}</h2>
            <span className="rule"></span>
          </div>
          <div className="flow">
            {FLOW.map((s) => (
              <div className="step" key={s.n}>
                <span className="n">{s.n}</span>
                <h3>{t(s.t)}</h3>
                <p dangerouslySetInnerHTML={{ __html: t(s.d) }} />
              </div>
            ))}
          </div>
        </section>

        <footer>
          <p className="big" dangerouslySetInnerHTML={{ __html: t('foot.big') }} />
          <p className="sub" dangerouslySetInnerHTML={{ __html: t('foot.sub') }} />
          <div className="foot-links">
            <a className="primary" href="https://reaper.my.id">
              <span>{t('foot.main')}</span>
            </a>
            <a href="https://tracker.reaper.my.id/" target="_blank" rel="noopener">
              <span>{t('foot.tracker')}</span>
            </a>
            <a href="https://t.me/holyinthefire" target="_blank" rel="noopener">
              Telegram — @holyinthefire
            </a>
          </div>
          <div className="colophon">
            <span>{t('colo.left')}</span>
            <span>{t('colo.right')}</span>
          </div>
        </footer>
      </main>
    </>
  )
}
