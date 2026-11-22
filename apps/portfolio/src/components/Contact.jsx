import { I18N } from '../i18n.js'

export default function Contact({ lang }) {
  const t = (k) => I18N[lang][k]
  return (
    <footer className="reveal" id="contact">
      <div className="sec-head">
        <span className="no">03</span>
        <h2>{t('nav.contact')}</h2>
        <span className="rule"></span>
      </div>

      <div>
        <p className="big" dangerouslySetInnerHTML={{ __html: t('contact.big') }} />
        <p className="sub" dangerouslySetInnerHTML={{ __html: t('contact.sub') }} />
        <div className="contact-links">
          <a className="primary" href="https://t.me/holyinthefire" target="_blank" rel="noopener">
            Telegram — @holyinthefire
          </a>
          <a href="https://x.com/paraboyyyy" target="_blank" rel="noopener">
            X — @paraboyyyy
          </a>
          <a href="https://github.com/reaperads" target="_blank" rel="noopener">
            GitHub — reaperads
          </a>
          <a href="https://www.linkedin.com/in/agdaalif" target="_blank" rel="noopener">
            LinkedIn — agdaalif
          </a>
        </div>
      </div>

      <div className="colophon">
        <span>{t('colo.left')}</span>
        <span>{t('colo.right')}</span>
      </div>
    </footer>
  )
}
