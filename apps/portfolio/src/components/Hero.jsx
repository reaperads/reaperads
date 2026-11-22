import { I18N } from '../i18n.js'
import Terminal from './Terminal.jsx'

export default function Hero({ lang, onLangChange, bootSignal, data, dataLive, agents }) {
  const t = (k) => I18N[lang][k]
  return (
    <header className="hero" id="top">
      <div className="hero-grid">
        <div>
          <p className="role">{t('hero.role')}</p>
          <h1 className="name">Reaper</h1>
          <p className="lede" dangerouslySetInnerHTML={{ __html: t('hero.lede') }} />
          <div className="handles">
            <a href="https://x.com/paraboyyyy" target="_blank" rel="noopener">
              <span>X</span>@paraboyyyy
            </a>
            <a href="https://github.com/reaperads" target="_blank" rel="noopener">
              <span>GH</span>reaperads
            </a>
            <a href="https://www.linkedin.com/in/agdaalif" target="_blank" rel="noopener">
              <span>IN</span>agdaalif
            </a>
            <a href="https://t.me/holyinthefire" target="_blank" rel="noopener">
              <span>TG</span>@holyinthefire
            </a>
            <a href="https://agent.reaper.my.id">
              <span>AG</span>agent.reaper.my.id
            </a>
          </div>
        </div>

        <div>
          <Terminal
            lang={lang}
            onLangChange={onLangChange}
            bootSignal={bootSignal}
            data={data}
            dataLive={dataLive}
            agents={agents}
          />
        </div>
      </div>
    </header>
  )
}
