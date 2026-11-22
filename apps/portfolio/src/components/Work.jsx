import { useState } from 'react'
import { I18N } from '../i18n.js'
import { progName, sortedReports, statusClass, statusLabel } from '../data/helpers.js'

const FOCUS = [
  { idx: '/01', t: 'f1.t', d: 'f1.d', tags: 'SSRF · canary · port oracle · metadata' },
  { idx: '/02', t: 'f2.t', d: 'f2.d', tags: 'IDOR · auth bypass · session takeover' },
  { idx: '/03', t: 'f3.t', d: 'f3.d', tags: 'Solana · Foundry · PoC in .t.sol' },
  { idx: '/04', t: 'f4.t', d: 'f4.d', tags: 'OpenPGP · S2K · resource exhaustion' },
  { idx: '/05', t: 'f5.t', d: 'f5.d', tags: 'dorks · RSS · code search · alerting' },
]

const WORK_ROWS = [
  { cat: 'web2', when: '2026-11', prog: 'Liquid Web', d: 'w1.d', status: 's-review', st: 'st.review' },
  { cat: 'web3', when: '2026-11', prog: 'Relay', d: 'w2.d', status: 's-review', st: 'st.progress' },
  { cat: 'oss', when: '2026-11', prog: 'PGPainless', d: 'w3.d', status: 's-review', st: 'st.ready' },
  { cat: 'web2', when: '2026-11', prog: 'Alaan', d: 'w4.d', status: 's-review', st: 'st.review2' },
  { cat: 'oss', when: '2026-11', prog: 'Neo N3', d: 'w5.d', status: 's-closed', st: 'st.closed' },
  { cat: 'web2', when: '2026-11', prog: 'Blockonomics', d: 'w6.d', status: 's-closed', st: 'st.dup' },
  { cat: 'web3', when: '2026-11', prog: 'BrainChain', d: 'w7.d', status: 's-closed', st: 'st.closed2' },
]

const FILTERS = [
  { f: 'all', label: 'flt.all' },
  { f: 'web2', label: null, text: 'Web2' },
  { f: 'web3', label: null, text: 'Web3' },
  { f: 'oss', label: 'flt.oss' },
]

export default function Work({ lang, data }) {
  const t = (k) => I18N[lang][k]
  const [filter, setFilter] = useState('all')
  const visible = WORK_ROWS.filter((r) => filter === 'all' || r.cat === filter)
  const live = sortedReports(data, 6)

  return (
    <section id="work" className="reveal">
      <div className="sec-head">
        <span className="no">02</span>
        <h2>{t('work.title')}</h2>
        <span className="rule"></span>
      </div>
      <h3 className="sub-label">{t('focus.title')}</h3>
      <div className="focus-list">
        {FOCUS.map((f) => (
          <div className="focus-row" key={f.idx}>
            <span className="idx">{f.idx}</span>
            <h3>{t(f.t)}</h3>
            <p>
              <span dangerouslySetInnerHTML={{ __html: t(f.d) }} />
              <span className="tags">{f.tags}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="filters" role="group" aria-label="Filter work">
        {FILTERS.map((f) => (
          <button
            key={f.f}
            data-filter={f.f}
            aria-pressed={filter === f.f ? 'true' : 'false'}
            onClick={() => setFilter(f.f)}
          >
            {f.label ? t(f.label) : f.text}
          </button>
        ))}
      </div>
      <div className="work-table" id="work-table">
        {WORK_ROWS.map((r) => (
          <div
            key={r.prog}
            className={'work-row' + (filter !== 'all' && r.cat !== filter ? ' hide' : '')}
            data-cat={r.cat}
          >
            <span className="when">{r.when}</span>
            <span className="prog">{r.prog}</span>
            <span className="what" dangerouslySetInnerHTML={{ __html: t(r.d) }} />
            <span className={'status ' + r.status}>{t(r.st)}</span>
          </div>
        ))}
        <p
          className="work-empty"
          id="work-empty"
          style={{ display: visible.length ? 'none' : 'block' }}
        >
          {t('work.empty')}
        </p>
      </div>
      <div className="live-head">
        <h3>{t('live.title')}</h3>
        <a href="https://tracker.reaper.my.id/" target="_blank" rel="noopener">
          {t('live.all')}
        </a>
      </div>
      <div id="live-log">
        {live.map((r) => (
          <div className="live-row" key={r.id}>
            <span className="when">{r.updated || ''}</span>
            <span className="prog">{progName(data, r.programId)}</span>
            <span className="title">{r.title || ''}</span>
            <span className="meta">
              <span className="sev">{r.severity || ''}</span>
              <span className={'status ' + statusClass(r.status)}>
                {'● ' + statusLabel(r.status, lang)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
