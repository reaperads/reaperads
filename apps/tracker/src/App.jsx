import { useState, useEffect, useRef } from 'react'
import initialData from './initialData.json'

const KEY = 'reaper-bounty-tracker-v1'
const clone = (o) => JSON.parse(JSON.stringify(o))
const today = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const dateFmt = (v, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!v) return '—'
  const d = new Date(v + 'T12:00:00')
  return isNaN(d) ? '—' : new Intl.DateTimeFormat('id-ID', opts).format(d)
}
const initials = (s) =>
  String(s || '?')
    .replace(/^Demo\s*·\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && Array.isArray(saved.programs)) return saved
  } catch { /* fall through to starter */ }
  return clone(initialData)
}

export default function App() {
  const [data, setData] = useState(loadData)
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(null) // {kind, item}
  const [toastMsg, setToastMsg] = useState('')
  const [activeNav, setActiveNav] = useState('overview')
  const importRef = useRef(null)
  const toastTimer = useRef(null)

  // persist on every data change
  useEffect(() => {
    try {
      const stamped = { ...data, updatedAt: new Date().toISOString() }
      localStorage.setItem(KEY, JSON.stringify(stamped))
    } catch { /* storage full/blocked: keep rendering */ }
  }, [data])

  const toast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 3000)
  }

  const program = (id) => data.programs.find((p) => p.id === id)
  const programName = (id) => program(id)?.name || 'Program dihapus'
  const markCustom = () => setData((d) => ({ ...d, isDemo: false }))

  const saveRecord = (kind, values) => {
    const newId = () =>
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2))
    setData((d) => {
      const next = clone(d)
      const arr = { program: next.programs, scope: next.scopes, report: next.reports, action: next.actions }[kind]
      const existing = values.id ? arr.find((x) => x.id === values.id) : null
      if (kind === 'program') {
        const scopeChanged = existing && existing.scope !== values.scope
        const record = {
          id: values.id || newId(),
          name: values.name.trim(),
          source: (values.source || '').trim(),
          status: values.status,
          deadline: values.deadline,
          reviewDate: values.reviewDate,
          scopeChecked: values.scopeChecked,
          scope: (values.scope || '').trim(),
        }
        if (existing) Object.assign(existing, record)
        else next.programs.push(record)
        if (scopeChanged) {
          next.scopes.push({
            id: newId(),
            programId: record.id,
            date: today(),
            summary: 'Ringkasan scope diperbarui di tracker. Tinjau perubahan resmi di sumber program.',
            attention: true,
          })
        }
      }
      if (kind === 'scope') {
        const selected =
          next.programs.find((p) => p.name === values.programName)?.id || next.programs[0]?.id || ''
        const record = {
          id: values.id || newId(),
          programId: selected,
          date: values.date,
          summary: values.summary.trim(),
          attention: values.attention === 'Ya, perlu dicek',
        }
        if (existing) Object.assign(existing, record)
        else next.scopes.push(record)
        const p = next.programs.find((x) => x.id === selected)
        if (p) p.scopeChecked = values.date
      }
      if (kind === 'report') {
        const selected =
          next.programs.find((p) => p.name === values.programName)?.id || next.programs[0]?.id || ''
        const record = {
          id: values.id || newId(),
          programId: selected,
          title: values.title.trim(),
          severity: values.severity,
          status: values.status,
          updated: values.updated || today(),
        }
        if (existing) Object.assign(existing, record)
        else next.reports.push(record)
      }
      if (kind === 'action') {
        const selected =
          next.programs.find((p) => p.name === values.programName)?.id || next.programs[0]?.id || ''
        const record = {
          id: values.id || newId(),
          programId: selected,
          title: values.title.trim(),
          due: values.due,
          priority: values.priority,
          done: existing?.done || false,
        }
        if (existing) Object.assign(existing, record)
        else next.actions.push(record)
      }
      next.isDemo = false
      return next
    })
    toast('Tersimpan hanya di browser ini.')
  }

  const deleteItem = (kind, id) => {
    const arr = { program: data.programs, scope: data.scopes, report: data.reports, action: data.actions }[kind]
    const item = arr.find((x) => x.id === id)
    if (!item) return
    const label = kind === 'program' ? 'program' : kind === 'report' ? 'laporan' : 'item'
    if (
      !window.confirm(
        `Hapus ${label} “${item.name || item.title || item.summary || ''}”?${
          kind === 'program' ? ' Catatan scope, laporan, dan tindakan terkait juga akan dihapus.' : ''
        }`
      )
    )
      return
    setData((d) => {
      const next = clone(d)
      const list = { program: next.programs, scope: next.scopes, report: next.reports, action: next.actions }[kind]
      list.splice(list.indexOf(list.find((x) => x.id === id)), 1)
      if (kind === 'program') {
        next.scopes = next.scopes.filter((x) => x.programId !== id)
        next.reports = next.reports.filter((x) => x.programId !== id)
        next.actions = next.actions.filter((x) => x.programId !== id)
      }
      next.isDemo = false
      return next
    })
    toast('Item dihapus dari penyimpanan lokal.')
  }

  const toggleAction = (id, done) => {
    setData((d) => {
      const next = clone(d)
      const a = next.actions.find((x) => x.id === id)
      if (a) a.done = done
      next.isDemo = false
      return next
    })
    toast(done ? 'Tindakan ditandai selesai.' : 'Tindakan dibuka kembali.')
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'reaper-bug-bounty-backup-' + today() + '.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Backup JSON diunduh ke perangkat ini. Jaga file backup tetap privat.')
  }

  const importBackup = async (file) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (
        !parsed ||
        !Array.isArray(parsed.programs) ||
        !Array.isArray(parsed.scopes) ||
        !Array.isArray(parsed.reports) ||
        !Array.isArray(parsed.actions)
      )
        throw new Error('Format tracker tidak lengkap')
      if (!window.confirm('Impor akan mengganti data tracker yang sedang tersimpan di browser ini. Lanjutkan?')) return
      setData({
        version: 1,
        isDemo: false,
        updatedAt: new Date().toISOString(),
        programs: parsed.programs,
        scopes: parsed.scopes,
        reports: parsed.reports,
        actions: parsed.actions,
      })
      toast('Backup berhasil dimuat.')
    } catch {
      toast('Gagal impor: pastikan file adalah backup JSON REAPER yang valid.')
    }
  }

  const clearAll = () => {
    if (!window.confirm('Hapus semua data tracker ini dan mulai dengan daftar kosong?')) return
    setData({ version: 1, isDemo: false, updatedAt: null, programs: [], scopes: [], reports: [], actions: [] })
    toast('Data tracker dihapus. Tracker siap diisi.')
  }

  // ---- derived values ----
  const active = data.programs.filter((p) => p.status === 'Aktif').length
  const upcoming = data.programs.filter((p) => p.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline))
  const openReports = data.reports.filter((r) => !['Selesai', 'Ditutup'].includes(r.status)).length
  const pending = data.actions.filter((a) => !a.done).length
  const daysTo = (date) =>
    Math.ceil((new Date(date + 'T23:59:59') - new Date(today() + 'T00:00:00')) / 86400000)
  const latestScopes = [...data.scopes].sort((a, b) => b.date.localeCompare(a.date))
  const progs = data.programs.filter((p) =>
    (p.name + ' ' + p.scope + ' ' + p.source).toLowerCase().includes(query.trim().toLowerCase())
  )
  const logs = latestScopes
  const sortedReports = [...data.reports].sort((a, b) => b.updated.localeCompare(a.updated))
  const sortedActions = [...data.actions].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.due || '9999').localeCompare(b.due || '9999')
  )
  const lastSaved = data.updatedAt
    ? 'TERSIMPAN LOKAL · ' +
      new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(data.updatedAt))
    : 'LOCAL · BELUM ADA PERUBAHAN'
  const nearest = upcoming[0]

  const dueBadge = (date) => {
    if (!date) return <span className="pill closed">Tanpa deadline</span>
    const days = daysTo(date)
    const cls = days < 0 ? 'danger' : days <= 3 ? 'paused' : 'info'
    return (
      <span className={`pill ${cls}`}>
        {days < 0 ? 'Lewat ' + Math.abs(days) + 'h' : days === 0 ? 'Hari ini' : days + ' hari'}
      </span>
    )
  }

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <a className="brand" href="#overview" aria-label="Reaper dashboard">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.8 20 6v5.2c0 5.3-3.3 8.4-8 10-4.7-1.6-8-4.7-8-10V6l8-3.2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m8.5 12 2.2 2.2 4.8-5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              REAPER<span style={{ color: 'var(--cyan)' }}>.</span>
            </span>
          </a>
          <div className="top-actions">
            <span className="local-chip">
              <i></i> DATA LOKAL
            </span>
            <button className="btn" id="exportBtn" type="button" onClick={exportBackup}>
              ↧ <span>Backup JSON</span>
            </button>
            <button className="btn" id="importBtn" type="button" onClick={() => importRef.current?.click()}>
              ↥ <span>Impor</span>
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                importBackup(e.target.files[0])
                e.target.value = ''
              }}
            />
            <button className="btn btn-primary" type="button" onClick={() => setEditor({ kind: 'program', item: null })}>
              ＋ Program
            </button>
          </div>
        </div>
      </header>

      <div className="shell layout">
        <aside className="side">
          <div className="side-label">Workspace</div>
          <nav className="side-nav" aria-label="Navigasi dashboard">
            {[
              ['overview', '◈', 'Ringkasan'],
              ['programs', '▦', 'Program'],
              ['scope', '⌁', 'Perubahan scope'],
              ['reports', '▤', 'Laporan'],
              ['actions', '✓', 'Tindakan'],
            ].map(([id, ico, label]) => (
              <a
                key={id}
                href={'#' + id}
                className={activeNav === id ? 'active' : ''}
                onClick={() => setActiveNav(id)}
              >
                <span className="ico">{ico}</span> {label}
              </a>
            ))}
          </nav>
          <div className="side-note">
            <strong>Ruang kerja privat</strong>
            Semua data disimpan di penyimpanan browser ini. Tidak ada sinkronisasi atau enkripsi bawaan. Jangan simpan
            PII, kredensial, atau bukti sensitif di sini.
          </div>
        </aside>

        <main className="content" id="overview">
          <div className="page-head">
            <div>
              <span className="eyebrow">Bug bounty workspace</span>
              <h1>
                Control room<span style={{ color: 'var(--cyan)' }}>.</span>
              </h1>
              <p>Program, perubahan scope, tenggat, dan langkah berikutnya—di satu tempat.</p>
            </div>
            <div className="head-stamp" id="lastSaved">
              {lastSaved}
            </div>
          </div>

          <section className="kpis" aria-label="Ringkasan tracker">
            <article className="kpi">
              <div className="kpi-top">
                Program aktif <span className="kpi-icon">◈</span>
              </div>
              <div className="kpi-value">{active}</div>
              <div className="kpi-foot">Program yang sedang diikuti</div>
            </article>
            <article className="kpi">
              <div className="kpi-top">
                Tenggat terdekat <span className="kpi-icon">◷</span>
              </div>
              <div className="kpi-value">
                {nearest
                  ? (() => {
                      const days = daysTo(nearest.deadline)
                      return days < 0 ? 'Lewat' : days === 0 ? 'Hari ini' : days + 'h'
                    })()
                  : '—'}
              </div>
              <div className="kpi-foot">
                {nearest ? programName(nearest.id) + ' · ' + dateFmt(nearest.deadline) : 'Tidak ada tenggat tercatat'}
              </div>
            </article>
            <article className="kpi">
              <div className="kpi-top">
                Laporan terbuka <span className="kpi-icon">▤</span>
              </div>
              <div className="kpi-value">{openReports}</div>
              <div className="kpi-foot">Belum berstatus selesai/ditutup</div>
            </article>
            <article className="kpi">
              <div className="kpi-top">
                Tindakan tertunda <span className="kpi-icon">✓</span>
              </div>
              <div className="kpi-value">{pending}</div>
              <div className="kpi-foot">Langkah berikutnya yang belum selesai</div>
            </article>
          </section>

          <section className="dashboard-grid" aria-label="Sorotan">
            <article className="panel">
              <div className="panel-head">
                <div>
                  <h2>Tenggat berikutnya</h2>
                  <p>Urut dari yang paling dekat</p>
                </div>
                <a className="link-btn" href="#programs">
                  Semua program →
                </a>
              </div>
              <div className="deadline-list" id="deadlineList">
                {upcoming.length ? (
                  upcoming.slice(0, 4).map((p) => {
                    const n = daysTo(p.deadline)
                    return (
                      <div className="deadline-row" key={p.id}>
                        <div className="date-box">
                          <strong>{dateFmt(p.deadline, { day: '2-digit' })}</strong>
                          <span>{dateFmt(p.deadline, { month: 'short' }).replace('.', '')}</span>
                        </div>
                        <div className="deadline-info">
                          <strong>{p.name}</strong>
                          <span>{p.scope || 'Scope belum diringkas'}</span>
                        </div>
                        <div className={`deadline-when ${n <= 3 ? 'soon' : ''}`}>
                          {n < 0 ? 'Lewat' : n === 0 ? 'Hari ini' : n + ' hari lagi'}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="empty">
                    <strong>Belum ada tenggat</strong>Tambahkan deadline pada program untuk melihat pengingat di sini.
                  </div>
                )}
              </div>
            </article>
            <article className="panel">
              <div className="panel-head">
                <div>
                  <h2>Perubahan scope terbaru</h2>
                  <p>Catatan perubahan yang Anda masukkan</p>
                </div>
                <a className="link-btn" href="#scope">
                  Riwayat →
                </a>
              </div>
              <div className="mini-timeline" id="miniTimeline">
                {latestScopes.length ? (
                  latestScopes.slice(0, 3).map((s) => (
                    <div className="timeline-item" key={s.id}>
                      <div className="timeline-meta">
                        <span>{programName(s.programId)}</span>
                        <time>{dateFmt(s.date, { day: '2-digit', month: 'short' })}</time>
                      </div>
                      <strong>{s.attention ? 'Perlu ditinjau' : 'Scope dicatat'}</strong>
                      <p>{s.summary}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <strong>Belum ada catatan</strong>Perubahan scope yang dicatat akan muncul di sini.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="section-block" id="programs">
            <div className="section-title">
              <div>
                <h2>Program diikuti</h2>
                <p>Pantau status, ringkasan scope, dan tanggal review / tenggat.</p>
              </div>
              <div className="section-actions">
                <input
                  className="search"
                  type="search"
                  placeholder="Cari program atau scope…"
                  aria-label="Cari program atau scope"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="btn btn-small" type="button" onClick={() => setEditor({ kind: 'program', item: null })}>
                  ＋ Tambah program
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Ringkasan scope</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {progs.length ? (
                    progs.map((p) => (
                      <tr key={p.id}>
                        <td data-label="Program">
                          <div className="program-main">
                            <span className="program-symbol">{initials(p.name)}</span>
                            <span>
                              <strong>{p.name}</strong>
                              <span>{p.source || 'Sumber belum diisi'}</span>
                            </span>
                          </div>
                        </td>
                        <td data-label="Ringkasan scope">
                          <span className="scope-text" title={p.scope}>
                            {p.scope || 'Belum dicatat'}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`pill ${p.status === 'Aktif' ? '' : 'paused'}`}>{p.status}</span>
                        </td>
                        <td data-label="Deadline">
                          {p.deadline ? (
                            <>
                              {dateFmt(p.deadline)} {dueBadge(p.deadline)}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td data-label="Aksi">
                          <div className="row-actions">
                            <button
                              className="icon-btn"
                              aria-label={'Edit ' + p.name}
                              title="Edit"
                              onClick={() => setEditor({ kind: 'program', item: p })}
                            >
                              ✎
                            </button>
                            <button
                              className="icon-btn"
                              aria-label={'Hapus ' + p.name}
                              title="Hapus"
                              onClick={() => deleteItem('program', p.id)}
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="empty">
                          <strong>Belum ada program</strong>
                          {query
                            ? 'Coba kata pencarian lain atau bersihkan pencarian.'
                            : 'Tambahkan program yang Anda ikuti untuk mulai melacak.'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section-block" id="scope">
            <div className="section-title">
              <div>
                <h2>Riwayat perubahan scope</h2>
                <p>Catat perubahan resmi yang sudah Anda tinjau; verifikasi selalu di sumber program.</p>
              </div>
              <button className="btn btn-small" type="button" onClick={() => setEditor({ kind: 'scope', item: null })}>
                ＋ Catat perubahan
              </button>
            </div>
            <div className="scope-layout">
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Log perubahan</h2>
                    <p>Waktu, program, dan ringkasan perubahan</p>
                  </div>
                </div>
                <div className="scope-panel" id="scopeLogs">
                  {logs.length ? (
                    logs.map((s) => (
                      <div className="scope-log" key={s.id}>
                        <time>{dateFmt(s.date, { day: '2-digit', month: 'short', year: 'numeric' })}</time>
                        <div>
                          <strong>
                            {programName(s.programId)}{' '}
                            {s.attention ? <span className="pill paused">Perlu cek</span> : ''}
                          </strong>
                          <p>{s.summary}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      <strong>Belum ada perubahan scope</strong>Catat perubahan resmi setelah memeriksanya pada sumber
                      program.
                    </div>
                  )}
                </div>
              </article>
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Checklist scope</h2>
                    <p>Sebelum melanjutkan pengujian</p>
                  </div>
                  <span className="pill info">REVIEW</span>
                </div>
                <div className="scope-panel">
                  <div className="scope-log">
                    <time>01 / ASSET</time>
                    <div>
                      <strong>Pastikan aset masih tercantum</strong>
                      <p>Jangan menganggap subdomain atau layanan terkait otomatis masuk scope.</p>
                    </div>
                  </div>
                  <div className="scope-log">
                    <time>02 / RULES</time>
                    <div>
                      <strong>Baca ulang aturan program</strong>
                      <p>Periksa metode terlarang, batas laju, akun uji, dan jalur pelaporan.</p>
                    </div>
                  </div>
                  <div className="scope-log">
                    <time>03 / CHANGE</time>
                    <div>
                      <strong>Catat tanggal verifikasi</strong>
                      <p>Simpan ringkasan saja; hindari menyimpan bukti atau data pengguna.</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="section-block" id="reports">
            <div className="section-title">
              <div>
                <h2>Laporan</h2>
                <p>Kelola progres laporan tanpa menyimpan rincian sensitif.</p>
              </div>
              <button className="btn btn-small" type="button" onClick={() => setEditor({ kind: 'report', item: null })}>
                ＋ Tambah laporan
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Laporan</th>
                    <th>Program</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Diperbarui</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReports.length ? (
                    sortedReports.map((r) => (
                      <tr key={r.id}>
                        <td data-label="Laporan">
                          <span className="report-title">{r.title}</span>
                          <span className="report-sub">ID lokal · {r.id.slice(-5)}</span>
                        </td>
                        <td data-label="Program">{programName(r.programId)}</td>
                        <td data-label="Severity">
                          <span className={`severity ${r.severity.toLowerCase()}`}>{r.severity}</span>
                        </td>
                        <td data-label="Status">
                          <span
                            className={`pill ${
                              r.status === 'Selesai' || r.status === 'Ditutup'
                                ? 'closed'
                                : r.status === 'Draft'
                                  ? 'paused'
                                  : 'info'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td data-label="Diperbarui">{dateFmt(r.updated)}</td>
                        <td data-label="Aksi">
                          <div className="row-actions">
                            <button
                              className="icon-btn"
                              aria-label="Edit laporan"
                              onClick={() => setEditor({ kind: 'report', item: r })}
                            >
                              ✎
                            </button>
                            <button
                              className="icon-btn"
                              aria-label="Hapus laporan"
                              onClick={() => deleteItem('report', r.id)}
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="empty">
                          <strong>Belum ada laporan</strong>
                          Tambahkan label dan status; hindari menyimpan rincian temuan sensitif.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section-block" id="actions">
            <div className="section-title">
              <div>
                <h2>Tindakan berikutnya</h2>
                <p>Catat pekerjaan lanjutan, tenggat pribadi, dan prioritas.</p>
              </div>
              <button className="btn btn-small" type="button" onClick={() => setEditor({ kind: 'action', item: null })}>
                ＋ Tambah tindakan
              </button>
            </div>
            <article className="panel">
              <div className="action-list" id="actionList">
                {sortedActions.length ? (
                  sortedActions.map((a) => (
                    <div className={`action-row ${a.done ? 'done' : ''}`} key={a.id}>
                      <input
                        className="check-action"
                        type="checkbox"
                        checked={a.done}
                        onChange={(e) => toggleAction(a.id, e.target.checked)}
                        aria-label="Tandai tindakan selesai"
                      />
                      <div className="action-info">
                        <strong>
                          {a.title}
                          {a.priority === 'Tinggi' ? <span className="action-priority">Prioritas tinggi</span> : ''}
                        </strong>
                        <span>{programName(a.programId)}</span>
                      </div>
                      <span className="action-due">
                        {a.due ? dateFmt(a.due, { day: '2-digit', month: 'short' }) : 'Tanpa tanggal'}{' '}
                        <button
                          className="icon-btn"
                          aria-label="Edit tindakan"
                          title="Edit"
                          onClick={() => setEditor({ kind: 'action', item: a })}
                        >
                          ✎
                        </button>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <strong>Semua beres</strong>Belum ada tindakan. Tambahkan langkah kecil berikutnya.
                  </div>
                )}
              </div>
            </article>
          </section>

          <footer className="footer">
            <span>
              <strong>REAPER.</strong> Tracker lokal untuk riset yang bertanggung jawab.
            </span>
            <span>Tersimpan di browser ini · Backup JSON dapat berisi data sensitif</span>
          </footer>
        </main>
      </div>

      {editor && (
        <EditorDialog
          kind={editor.kind}
          item={editor.item}
          programs={data.programs}
          onClose={() => setEditor(null)}
          onSave={(values) => {
            saveRecord(editor.kind, values)
            setEditor(null)
          }}
        />
      )}
      <div className={`toast ${toastMsg ? 'show' : ''}`} id="toast" role="status" aria-live="polite">
        {toastMsg}
      </div>
    </>
  )
}

function EditorDialog({ kind, item, programs, onClose, onSave }) {
  const titles = {
    program: item ? 'Edit program' : 'Tambah program',
    scope: 'Catat perubahan scope',
    report: item ? 'Edit laporan' : 'Tambah laporan',
    action: item ? 'Edit tindakan' : 'Tambah tindakan',
  }
  const formRef = useRef(null)

  useEffect(() => {
    const first = formRef.current?.querySelector('input,select,textarea')
    first?.focus()
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const obj = Object.fromEntries(new FormData(e.currentTarget).entries())
    onSave({ id: item?.id || null, ...obj })
  }

  const field = (label, name, type = 'text', value = '', extra = {}) => (
    <div className="field">
      <label htmlFor={'f-' + name}>{label}</label>
      <input id={'f-' + name} name={name} type={type} defaultValue={value} {...extra} />
    </div>
  )
  const selectField = (label, name, options, value) => (
    <div className="field">
      <label htmlFor={'f-' + name}>{label}</label>
      <select id={'f-' + name} name={name} defaultValue={value}>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </div>
  )
  const areaField = (label, name, value = '', hint = '') => (
    <div className="field full">
      <label htmlFor={'f-' + name}>{label}</label>
      <textarea id={'f-' + name} name={name} placeholder={hint} defaultValue={value}></textarea>
      {hint ? <span className="hint">{hint}</span> : ''}
    </div>
  )
  const programOptions = programs.map((p) => p.name)
  const currentProgramName = item?.programId
    ? programs.find((p) => p.id === item.programId)?.name || programOptions[0]
    : programOptions[0]

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <dialog open>
        <form ref={formRef} onSubmit={submit}>
          <div className="dialog-head">
            <h2>{titles[kind]}</h2>
            <button className="icon-btn" type="button" onClick={onClose} aria-label="Tutup">
              ×
            </button>
          </div>
          <div className="dialog-body">
            {kind === 'program' && (
              <div className="form-grid">
                {field('Nama program', 'name', 'text', item?.name || '', { required: true, maxLength: 90 })}
                {field('Platform / sumber (opsional)', 'source', 'text', item?.source || '', { maxLength: 80 })}
                {selectField('Status', 'status', ['Aktif', 'Jeda', 'Selesai'], item?.status || 'Aktif')}
                {field('Deadline program (opsional)', 'deadline', 'date', item?.deadline || '')}
                {field('Tanggal review scope', 'reviewDate', 'date', item?.reviewDate || '')}
                {field('Terakhir cek scope', 'scopeChecked', 'date', item?.scopeChecked || today())}
                {areaField(
                  'Ringkasan scope yang diizinkan',
                  'scope',
                  item?.scope || '',
                  'Contoh: app.example.com · web app. Jangan masukkan temuan, kredensial, atau PII.'
                )}
              </div>
            )}
            {kind === 'scope' && (
              <div className="form-grid">
                {selectField('Program', 'programName', programOptions, currentProgramName)}
                {field('Tanggal diperiksa', 'date', 'date', item?.date || today(), { required: true })}
                {areaField(
                  'Ringkasan perubahan (tanpa detail sensitif)',
                  'summary',
                  item?.summary || '',
                  'Apa yang berubah? Tulis ringkasan singkat dan verifikasi di kanal resmi.'
                )}
                {selectField(
                  'Perlu verifikasi ulang?',
                  'attention',
                  ['Ya, perlu dicek', 'Tidak'],
                  item?.attention ? 'Ya, perlu dicek' : 'Tidak'
                )}
              </div>
            )}
            {kind === 'report' && (
              <div className="form-grid">
                {field('Judul / label laporan', 'title', 'text', item?.title || '', { required: true, maxLength: 110 })}
                {selectField('Program', 'programName', programOptions, currentProgramName)}
                {selectField('Severity', 'severity', ['Critical', 'High', 'Medium', 'Low', 'Info'], item?.severity || 'Medium')}
                {selectField(
                  'Status',
                  'status',
                  ['Draft', 'Dikirim', 'Triase', 'Perlu info', 'Diterima', 'Selesai', 'Ditutup'],
                  item?.status || 'Draft'
                )}
                {field('Terakhir diperbarui', 'updated', 'date', item?.updated || today())}
                <div className="field full">
                  <span className="hint">
                    Simpan hanya judul umum dan status. Jangan masukkan detail eksploit, data pengguna, kredensial, atau
                    bukti sensitif.
                  </span>
                </div>
              </div>
            )}
            {kind === 'action' && (
              <div className="form-grid">
                {field('Tindakan berikutnya', 'title', 'text', item?.title || '', { required: true, maxLength: 120 })}
                {selectField('Program', 'programName', programOptions, currentProgramName)}
                {field('Tenggat pribadi (opsional)', 'due', 'date', item?.due || '')}
                {selectField('Prioritas', 'priority', ['Tinggi', 'Normal', 'Rendah'], item?.priority || 'Normal')}
              </div>
            )}
          </div>
          <div className="dialog-foot">
            <button className="btn" type="button" onClick={onClose}>
              Batal
            </button>
            <button className="btn btn-primary" type="submit">
              Simpan lokal
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
