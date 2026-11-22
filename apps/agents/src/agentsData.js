// Agent-status helpers ported verbatim from the vanilla agents page.

export function fmtDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
      timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(iso))
  } catch (e) {
    return String(iso).slice(0, 10)
  }
}

export function fmtTime(iso, lang) {
  try {
    return (
      new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(iso)) + ' WIB'
    )
  } catch (e) {
    return '—'
  }
}

export function fetchJson(url) {
  return fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('http ' + r.status)
    return r.json()
  })
}

export function validAgents(j) {
  return j && Object.prototype.toString.call(j.agents) === '[object Array]' && j.agents.length > 0
}

export function agentStatus(agent) {
  const st = agent && agent.status ? String(agent.status).toLowerCase() : 'unknown'
  return st
}

export function seenText(agent, updatedAt, lang) {
  if (agent && agent.checked_at) return agent.checked_at
  if (agent && agent.lastSeen) return fmtTime(agent.lastSeen, lang)
  if (updatedAt) return fmtTime(updatedAt, lang)
  return '—'
}
