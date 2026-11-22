import { useEffect, useRef, useState } from 'react'
import { TXT } from '../terminalText.js'
import { I18N } from '../i18n.js'
import { fmtDate, progName, sortedReports, statValues } from '../data/helpers.js'

const esc = (s) => s.replace(/</g, '&lt;')
const nl2br = (s) => s.replace(/\n/g, '<br>')

export default function Terminal({ lang, onLangChange, bootSignal, data, dataLive, agents }) {
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const [lines, setLines] = useState([])
  const [typing, setTyping] = useState(null)
  const idRef = useRef(0)
  const reducedRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const langRef = useRef(lang)
  langRef.current = lang
  const dataRef = useRef(data)
  dataRef.current = data
  const dataLiveRef = useRef(dataLive)
  dataLiveRef.current = dataLive
  const agentsRef = useRef(agents)
  agentsRef.current = agents

  const appendLine = (html, cls) => {
    idRef.current += 1
    const id = idRef.current
    setLines((prev) => [...prev, { id, html, cls: cls || '' }])
  }

  const typeCmd = (text, done) => {
    if (reducedRef.current) {
      appendLine('<span class="p">➜ ~</span> ' + esc(text))
      if (done) done()
      return
    }
    setTyping({ text: '' })
    let i = 0
    const iv = setInterval(() => {
      i += 1
      const cur = text.slice(0, i)
      setTyping({ text: cur })
      if (i >= text.length) {
        clearInterval(iv)
        setTyping(null)
        appendLine('<span class="p">➜ ~</span> ' + esc(text))
        if (done) done()
      }
    }, 55)
  }

  const boot = () => {
    setLines([])
    setTyping(null)
    const t = TXT[langRef.current]
    typeCmd(t.boot1, () => {
      appendLine(nl2br(t.bootOut))
      appendLine(t.bootHint, 'dim')
    })
  }
  const bootRef = useRef(boot)
  bootRef.current = boot

  // Boot once on mount, and re-boot when the language toggles via the
  // header buttons (bootSignal). A `lang` switch typed inside the
  // terminal itself does NOT re-boot — same as the vanilla page.
  useEffect(() => {
    bootRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (bootSignal > 0) bootRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootSignal])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, typing])

  const buildWhoami = () => {
    const v = statValues(dataRef.current)
    return langRef.current === 'id'
      ? 'reaper — peneliti keamanan independen.\n' +
          v.programs +
          ' program dilacak, ' +
          v.reports +
          ' laporan terkirim.\nmerusak dengan izin, menulisnya dengan bukti.'
      : 'reaper — independent security researcher.\n' +
          v.programs +
          ' programs tracked, ' +
          v.reports +
          ' reports filed.\nbreaks things with permission, writes it up with proof.'
  }

  const buildStats = () => {
    const v = statValues(dataRef.current)
    const upd =
      dataRef.current && dataRef.current.updatedAt
        ? fmtDate(dataRef.current.updatedAt, langRef.current)
        : '—'
    return langRef.current === 'id'
      ? 'program   ' +
          v.programs +
          ' (' +
          v.active +
          ' aktif)\nlaporan   ' +
          v.reports +
          ' (' +
          v.open +
          ' masih berjalan)\ndata per  ' +
          upd +
          (dataLiveRef.current ? ' · live' : ' · snapshot')
      : 'programs  ' +
          v.programs +
          ' (' +
          v.active +
          ' active)\nreports   ' +
          v.reports +
          ' (' +
          v.open +
          ' still in play)\ndata as of ' +
          upd +
          (dataLiveRef.current ? ' · live' : ' · snapshot')
  }

  const buildAgents = () => {
    const linesOut = (agentsRef.current.agents || []).map((a) => {
      const st = a.status === 'up' ? 'online' : a.status
      return (
        (a.name || a.id) +
        ' — ' +
        (a.role || '') +
        ' · ' +
        st +
        (a.checked_at ? ' · ' + a.checked_at : '')
      )
    })
    linesOut.push(
      langRef.current === 'id'
        ? 'detail lengkap: agent.reaper.my.id'
        : 'full panel: agent.reaper.my.id'
    )
    return linesOut.join('\n')
  }

  const buildWork = () => {
    const reps = sortedReports(dataRef.current, 5)
    const out = reps.map(
      (r) =>
        (r.updated || '') +
        '  ' +
        progName(dataRef.current, r.programId).toLowerCase() +
        ' — ' +
        (r.title || '')
    )
    out.push(
      langRef.current === 'id'
        ? 'log lengkap: gulir ke bagian 02.'
        : 'full log: scroll down to section 02.'
    )
    return out.join('\n')
  }

  const runCommand = (raw) => {
    const cmd = raw.trim().toLowerCase()
    appendLine('<span class="p">➜ ~</span> ' + esc(raw.trim()))
    if (!cmd) return
    const t = TXT[langRef.current]
    const map = {
      help: 'help',
      bantuan: 'help',
      whoami: 'whoami',
      siapa: 'whoami',
      skills: 'skills',
      keahlian: 'skills',
      work: 'work',
      kerja: 'work',
      stack: 'stack',
      alat: 'stack',
      contact: 'contact',
      kontak: 'contact',
    }
    if (cmd === 'clear' || cmd === 'bersihkan') {
      setLines([])
      return
    }
    if (cmd === 'lang id' || cmd === 'bahasa id') {
      onLangChange('id')
      appendLine(TXT.id.switched)
      return
    }
    if (cmd === 'lang en' || cmd === 'bahasa en') {
      onLangChange('en')
      appendLine(TXT.en.switched)
      return
    }
    if (cmd === 'sudo') {
      appendLine(langRef.current === 'id' ? 'usaha yang bagus. tidak.' : 'nice try. no.')
      return
    }
    if (cmd === 'stats' || cmd === 'statistik') {
      appendLine(nl2br(buildStats()))
      return
    }
    if (cmd === 'agents' || cmd === 'agen') {
      appendLine(nl2br(buildAgents()))
      return
    }
    const key = map[cmd]
    if (key === 'whoami') {
      appendLine(nl2br(buildWhoami()))
      return
    }
    if (key === 'work') {
      appendLine(nl2br(buildWork()))
      return
    }
    if (key) appendLine(nl2br(t[key]))
    else appendLine(esc(t.unknown.replace('%s', cmd)))
  }

  return (
    <div>
      <div className="term" id="term" onClick={() => inputRef.current && inputRef.current.focus()}>
        <div className="term-head">
          <i></i>
          <i></i>
          <i></i>
          <span>reaper — zsh</span>
        </div>
        <div className="term-body" id="term-body" ref={bodyRef}>
          {lines.map((l) => (
            <div
              key={l.id}
              className={'out' + (l.cls ? ' ' + l.cls : '')}
              dangerouslySetInnerHTML={{ __html: l.html }}
            />
          ))}
          {typing !== null && (
            <div className="out caret">
              <span className="p">➜ ~</span> <span className="typed">{typing.text}</span>
            </div>
          )}
        </div>
        <div className="term-input-row">
          <span className="p">➜ ~</span>
          <input
            id="term-input"
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label="Terminal input"
            placeholder={I18N[lang]['term.ph']}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                runCommand(e.target.value)
                e.target.value = ''
              }
            }}
          />
        </div>
      </div>
      <p className="term-hint" dangerouslySetInnerHTML={{ __html: I18N[lang]['term.hint'] }} />
    </div>
  )
}
