import { useEffect, useRef, useState } from 'react'
import { I18N } from '../i18n.js'

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

export default function Header({ lang, onLang, theme, onToggleTheme, activeNav, onNavClick }) {
  const t = (k) => I18N[lang][k]
  const [clock, setClock] = useState('--:--:-- WIB')
  const [menuOpen, setMenuOpen] = useState(false)
  const listRef = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    setClock(tickClock())
    const iv = setInterval(() => setClock(tickClock()), 1000)
    return () => clearInterval(iv)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeMenu()
    }
    const onClick = (e) => {
      if (menuOpen && !(e.target.closest && e.target.closest('.statusbar'))) closeMenu()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [menuOpen])

  const themeLabel = theme === 'terminal' ? t('theme.paper') : t('theme.term')

  return (
    <div className="statusbar">
      <div className="wrap">
        <span className="status-open" title="Open to new programs">
          <span className="dot"></span>
          <span>{t('status.open')}</span>
        </span>
        <span className="hide-sm" id="clock">
          {clock}
        </span>
        <nav
          className={'hnav-list' + (menuOpen ? ' open' : '')}
          id="hnav-list"
          aria-label="Page sections / Bagian halaman"
          ref={listRef}
          onClick={(e) => {
            if (e.target.closest && e.target.closest('a')) closeMenu()
          }}
        >
          <a href="#top" data-nav="top" aria-current={activeNav === 'top' ? 'true' : undefined} onClick={() => onNavClick('top')}>
            <span>{t('nav.top')}</span>
          </a>
          <a href="#about" data-nav="about" aria-current={activeNav === 'about' ? 'true' : undefined} onClick={() => onNavClick('about')}>
            <span>{t('nav.about')}</span>
          </a>
          <a href="#work" data-nav="work" aria-current={activeNav === 'work' ? 'true' : undefined} onClick={() => onNavClick('work')}>
            <span>{t('nav.work')}</span>
          </a>
          <a href="https://agent.reaper.my.id">
            <span>{t('nav.agents')}</span>
          </a>
          <a href="#contact" data-nav="contact" aria-current={activeNav === 'contact' ? 'true' : undefined} onClick={() => onNavClick('contact')}>
            <span>{t('nav.contact')}</span>
          </a>
        </nav>
        <span className="spacer"></span>
        <div className="controls">
          <div className="seg" role="group" aria-label="Language / Bahasa">
            <button id="lang-en" aria-pressed={lang === 'en' ? 'true' : 'false'} onClick={() => onLang('en')}>
              EN
            </button>
            <button id="lang-id" aria-pressed={lang === 'id' ? 'true' : 'false'} onClick={() => onLang('id')}>
              ID
            </button>
          </div>
          <button className="theme-btn" id="theme-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            ◐ <span>{themeLabel}</span>
          </button>
        </div>
        <button
          className="hnav-btn"
          id="hnav-btn"
          type="button"
          aria-expanded={menuOpen ? 'true' : 'false'}
          aria-controls="hnav-list"
          aria-label="Menu"
          ref={btnRef}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="hnav-btn-icon" aria-hidden="true">
            {menuOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>
    </div>
  )
}
