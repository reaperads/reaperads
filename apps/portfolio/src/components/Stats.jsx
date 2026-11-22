import { useEffect, useRef, useState } from 'react'
import { I18N } from '../i18n.js'
import { fmtDate, statValues } from '../data/helpers.js'

const STAT_KEYS = ['programs', 'reports', 'active', 'open']
const STAT_LABELS = {
  programs: 'stat.programs',
  reports: 'stat.reports',
  active: 'stat.active',
  open: 'stat.open',
}

export default function Stats({ lang, data, dataLive, onRefresh }) {
  const t = (k) => I18N[lang][k]
  const values = statValues(data)
  const [display, setDisplay] = useState({ programs: 0, reports: 0, active: 0, open: 0 })
  const countedRef = useRef(false)
  const valuesRef = useRef(values)
  valuesRef.current = values
  const rootRef = useRef(null)

  // After the first count, data updates jump straight to the new values
  // (the vanilla refreshCounters()).
  useEffect(() => {
    if (countedRef.current) setDisplay(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.programs, values.reports, values.active, values.open])

  useEffect(() => {
    const runCounters = () => {
      if (countedRef.current) return
      countedRef.current = true
      const targets = valuesRef.current
      const t0 = performance.now()
      const step = (ts) => {
        const p = Math.min((ts - t0) / 900, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay({
          programs: Math.round(targets.programs * eased),
          reports: Math.round(targets.reports * eased),
          active: Math.round(targets.active * eased),
          open: Math.round(targets.open * eased),
        })
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    const el = rootRef.current
    let io = null
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              runCounters()
              if (io) io.disconnect()
            }
          })
        },
        { threshold: 0.05, rootMargin: '0px 0px 240px 0px' }
      )
      io.observe(el)
    }
    // Fail-safe: content must never stay at zero (e.g. in a full-page
    // capture that never scrolls). Count after 2s regardless.
    const timer = setTimeout(runCounters, 2000)
    return () => {
      if (io) io.disconnect()
      clearTimeout(timer)
    }
  }, [])

  const when = data && data.updatedAt ? new Date(data.updatedAt) : null
  let rel = ''
  if (when && !isNaN(when)) {
    const days = Math.floor((Date.now() - when.getTime()) / 86400000)
    rel = days <= 0 ? t('data.today') : t('data.daysago').replace('%d', days)
  }
  const syncText =
    (dataLive ? t('data.live') : t('data.snap')) +
    ' · ' +
    t('data.updated') +
    ' ' +
    (when && !isNaN(when) ? fmtDate(data.updatedAt, lang) : '—') +
    (rel ? ' (' + rel + ')' : '')

  return (
    <div className="stats reveal" ref={rootRef}>
      <div className="wrap" style={{ padding: 0 }}>
        {STAT_KEYS.map((k) => (
          <div className="stat" key={k}>
            <b>
              <span className="count" data-stat={k}>
                {display[k]}
              </span>
            </b>
            <span>{t(STAT_LABELS[k])}</span>
          </div>
        ))}
      </div>
      <div className={'sync-line' + (dataLive ? ' live' : '')} id="sync-line">
        <span className="dot"></span>
        <span id="sync-text">{syncText}</span>
        <button id="sync-btn" type="button" onClick={onRefresh}>
          {t('data.refresh')}
        </button>
      </div>
    </div>
  )
}
