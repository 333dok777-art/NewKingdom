import { Link } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext.jsx'

function HomeContent() {
  const { t } = useLanguage()

  return (
    <div className="page-shell home-shell">
      <header className="site-header home-header">
        <Link className="brand" to="/" aria-label={t.navigation.home}>
          <span className="brand__crest" aria-hidden="true">N</span>
          <span className="brand__name">NewKingdom</span>
        </Link>
        <nav className="site-header__actions" aria-label={t.navigation.account}>
          <LanguageSwitcher />
          <Link className="nav-button" to="/login">{t.navigation.login}</Link>
          <Link className="nav-button nav-button--register" to="/register">{t.navigation.register}</Link>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="game-title">
          <div className="hero__overlay" aria-hidden="true" />
          <div className="hero__atmosphere" aria-hidden="true">
            <span /><span /><span /><span /><span /><span />
          </div>
          <div className="hero__fog" aria-hidden="true" />
          <div className="hero__content">
            <p className="hero__eyebrow">{t.hero.eyebrow}</p>
            <h1 id="game-title" className="hero__title">NewKingdom</h1>
            <p className="hero__subtitle">{t.hero.description}</p>
            <div className="hero__actions" aria-label={t.hero.actions}>
              <Link className="button button--primary" to="/login">{t.navigation.login}</Link>
              <Link className="button button--secondary" to="/register">{t.navigation.register}</Link>
            </div>
          </div>
          <div className="hero__scroll-indicator" aria-hidden="true"><span /></div>
        </section>

        <section className="features" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="section-heading__eyebrow">{t.features.eyebrow}</p>
            <h2 id="features-title">{t.features.title}</h2>
          </div>
          <div className="feature-grid">
            {t.features.items.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-card__number" aria-hidden="true">{['I', 'II', 'III'][index]}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="legacy" aria-labelledby="legacy-title">
          <div className="legacy__intro">
            <p className="section-heading__eyebrow">{t.legacy.eyebrow}</p>
            <h2 id="legacy-title">{t.legacy.title}</h2>
            <p>{t.legacy.description}</p>
          </div>
          <div className="legacy__highlights">
            {t.legacy.items.map((highlight, index) => (
              <article className="legacy-highlight" key={highlight.title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
          <Link className="button button--primary legacy__cta" to="/register">{t.legacy.cta}</Link>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer__brand"><span className="brand__crest" aria-hidden="true">N</span><span>NewKingdom</span></div>
        <div className="home-footer__socials" aria-label={t.footer.social}><a href="#discord">Discord</a><a href="#x">X</a><a href="#youtube">YouTube</a></div>
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  )
}

export default function Home() {
  return <LanguageProvider><HomeContent /></LanguageProvider>
}
