import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Stats from './components/Stats.jsx'
import About from './components/About.jsx'
import Work from './components/Work.jsx'
import Contact from './components/Contact.jsx'
import { useAgentsData, useTrackerData } from './hooks.js'

const NAV_SECTIONS = ['top', 'about', 'work', 'contact']

export default function App() {
  const [lang, setLang] = useState('en')
  const [theme, setTheme] = useState('terminal')
  const [activeNav, setActiveNav] = useState('top')
  const [bootSignal, setBootSignal] = useState(0)
  const { data, live: dataLive, refresh: refreshData } = useTrackerData()
  const { agents, live: agentsLive, refresh: refreshAgents } = useAgentsData()

  useEffect(() => {
    document.documentElement.lang = lang === 'id' ? 'id' : 'en'
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Scroll-spy: highlight the nav link for the section in view.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveNav(e.target.id)
        })
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    NAV_SECTIONS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  // Language switch from the header buttons also re-boots the terminal
  // (a switch typed inside the terminal does not).
  const handleLangHeader = (l) => {
    setLang(l)
    setBootSignal((s) => s + 1)
  }

  return (
    <>
      <Header
        lang={lang}
        onLang={handleLangHeader}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'terminal' ? 'paper' : 'terminal'))}
        activeNav={activeNav}
        onNavClick={setActiveNav}
      />
      <main className="wrap">
        <Hero
          lang={lang}
          onLangChange={setLang}
          bootSignal={bootSignal}
          data={data}
          dataLive={dataLive}
          agents={agents}
        />
        <Stats lang={lang} data={data} dataLive={dataLive} onRefresh={refreshData} />
        <About lang={lang} />
        <Work lang={lang} data={data} />
        <Contact lang={lang} />
      </main>
    </>
  )
}
