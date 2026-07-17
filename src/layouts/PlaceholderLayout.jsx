import { Link } from 'react-router-dom'

export default function PlaceholderLayout({ children }) {
  return (
    <div className="placeholder-page">
      <header className="placeholder-header">
        <Link className="brand" to="/" aria-label="NewKingdom home">
          <span className="brand__crest" aria-hidden="true">N</span>
          <span className="brand__name">NewKingdom</span>
        </Link>
        <Link className="nav-button nav-button--register" to="/register">Register</Link>
      </header>
      <main className="placeholder-page__main">{children}</main>
      <footer className="site-footer"><p>© 2026 NewKingdom. Your legend begins here.</p></footer>
    </div>
  )
}
