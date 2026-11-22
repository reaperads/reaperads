// Helpers ported verbatim from the vanilla page's data logic.

export function statValues(data) {
  const progs = (data && data.programs) || []
  const reps = (data && data.reports) || []
  const active = progs.filter((p) => p.status === 'Aktif').length
  const open = reps.filter((r) => r.status !== 'Ditutup' && r.status !== 'Selesai').length
  return { programs: progs.length, reports: reps.length, active, open }
}

export function progName(data, id) {
  const ps = (data && data.programs) || []
  for (let i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i].name
  return id
}

export function fmtDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
      timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(iso))
  } catch (e) {
    return String(iso).slice(0, 10)
  }
}

export function statusClass(s) {
  if (s === 'Diterima') return 's-paid'
  if (s === 'Triase' || s === 'Perlu info') return 's-review'
  if (s === 'Ditutup' || s === 'Selesai') return 's-closed'
  return ''
}

const STATUS_EN = {
  Dikirim: 'sent',
  Triase: 'in triage',
  Ditutup: 'closed',
  Selesai: 'done',
  Diterima: 'accepted',
  'Perlu info': 'needs info',
}

export function statusLabel(s, lang) {
  if (lang === 'id') return s
  return STATUS_EN[s] || s
}

export function validData(j) {
  return (
    j &&
    Object.prototype.toString.call(j.programs) === '[object Array]' &&
    Object.prototype.toString.call(j.reports) === '[object Array]' &&
    j.programs.length > 0
  )
}

export function fetchJson(url) {
  return fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('http ' + r.status)
    return r.json()
  })
}

export function sortedReports(data, n) {
  const reps = ((data && data.reports) || []).slice()
  reps.sort((a, b) => ((b.updated || '') < (a.updated || '') ? -1 : 1))
  return reps.slice(0, n)
}
