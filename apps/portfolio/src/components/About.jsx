import { I18N } from '../i18n.js'

const PRINCIPLES = [
  { k: 'R-01', t: 'prin.1t', d: 'prin.1d' },
  { k: 'R-02', t: 'prin.2t', d: 'prin.2d' },
  { k: 'R-03', t: 'prin.3t', d: 'prin.3d' },
  { k: 'R-04', t: 'prin.4t', d: 'prin.4d' },
]

const STEPS = [
  { n: 'step_01', t: 'p1.t', d: 'p1.d' },
  { n: 'step_02', t: 'p2.t', d: 'p2.d' },
  { n: 'step_03', t: 'p3.t', d: 'p3.d' },
  { n: 'step_04', t: 'p4.t', d: 'p4.d' },
]

export default function About({ lang }) {
  const t = (k) => I18N[lang][k]
  return (
    <section id="about" className="reveal">
      <div className="sec-head">
        <span className="no">01</span>
        <h2>{t('about.title')}</h2>
        <span className="rule"></span>
      </div>
      <div className="about-grid">
        <div>
          <p dangerouslySetInnerHTML={{ __html: t('about.p1') }} />
          <p className="dim" dangerouslySetInnerHTML={{ __html: t('about.p2') }} />
        </div>
        <ul className="principles">
          {PRINCIPLES.map((p) => (
            <li key={p.k}>
              <span className="k">{p.k}</span>
              <p>
                <b>{t(p.t)}</b>
                <span dangerouslySetInnerHTML={{ __html: t(p.d) }} />
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="sub-block">
        <h3 className="sub-label">{t('proc.title')}</h3>
        <div className="process">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <span className="n">{s.n}</span>
              <h3>{t(s.t)}</h3>
              <p dangerouslySetInnerHTML={{ __html: t(s.d) }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
