import { useCallback, useEffect, useRef, useState } from 'react'
import { FALLBACK_DATA } from './data/fallbackData.js'
import { AGENTS_FALLBACK } from './agentsFallback.js'
import { fetchJson, validData } from './data/helpers.js'

// Tracker data: live file first (data.json next to this page, maintained
// from the tracker's initialData.json), bundled snapshot as fallback, then
// the absolute live URL. Same order and same live/snapshot semantics as
// the vanilla page.
export function useTrackerData(onDataChanged) {
  const [data, setData] = useState(FALLBACK_DATA)
  const [live, setLive] = useState(false)
  const dataRef = useRef(FALLBACK_DATA)
  const onChangedRef = useRef(onDataChanged)
  onChangedRef.current = onDataChanged

  const syncLive = useCallback(() => {
    const steps = [
      { kind: 'url', url: 'data.json' },
      { kind: 'snapshot' },
      { kind: 'url', url: 'https://reaper.my.id/data.json' },
    ]
    let i = 0
    const next = () => {
      if (i >= steps.length) return
      const step = steps[i++]
      if (step.kind === 'snapshot') {
        if (!validData(FALLBACK_DATA)) { next(); return }
        const prev = dataRef.current
        const changed =
          !prev ||
          FALLBACK_DATA.updatedAt !== prev.updatedAt ||
          FALLBACK_DATA.reports.length !== (prev.reports || []).length
        dataRef.current = FALLBACK_DATA
        setData(FALLBACK_DATA)
        if (changed && onChangedRef.current) onChangedRef.current()
        return
      }
      fetchJson(step.url)
        .then((j) => {
          if (!validData(j)) { next(); return }
          const prev = dataRef.current
          const changed =
            !prev ||
            j.updatedAt !== prev.updatedAt ||
            j.reports.length !== (prev.reports || []).length
          const isRemote = step.url.indexOf('reaper.my.id') !== -1 || step.url === 'data.json'
          dataRef.current = j
          setData(j)
          if (isRemote) setLive(true)
          if (changed && onChangedRef.current) onChangedRef.current()
        })
        .catch(() => next())
    }
    next()
  }, [])

  useEffect(() => { syncLive() }, [syncLive])

  return { data, live, refresh: syncLive }
}

function validAgents(j) {
  return j && Object.prototype.toString.call(j.agents) === '[object Array]' && j.agents.length > 0
}

// Agent status: live status.json next to this page wins when it exists;
// the baked-in snapshot is the fallback. Same chain as the vanilla page.
// The main page has no agents section — this state only feeds the
// terminal's `agents` command.
export function useAgentsData() {
  const [agents, setAgents] = useState(AGENTS_FALLBACK)
  const [live, setLive] = useState(false)

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

  return { agents, live, refresh: syncAgents }
}
