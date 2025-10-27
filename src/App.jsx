import './App.css'
import heroImage from './assets/hero.jpg'

function App() {
  return (
    <div className="page">
      <header className="top-nav">
        <div className="brand">Beautiful-Hair.com</div>

        <div className="search">
          <button className="menu-button" aria-label="Open navigation">
            <span className="menu-line" />
            <span className="menu-line" />
            <span className="menu-line" />
          </button>
          <input
            type="search"
            placeholder="Search for Salon"
            aria-label="Search for salon"
          />
          <button className="search-button" aria-label="Search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M11 4a7 7 0 0 1 5.196 11.664l4.57 4.57a1 1 0 0 1-1.414 1.414l-4.57-4.57A7 7 0 1 1 11 4m0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#">Salons</a>
          <a href="#">Shops</a>
          <a href="#" className="support-link">
            Support
          </a>
        </nav>
      </header>

      <main className="hero">
        <section className="hero-copy">
          <p className="eyebrow">Welcome to your next look.</p>
          <h1>Find a look that feels like you.</h1>
          <p className="subtitle">
            Here at Beautiful Hair, we strive to help you find a unique style
            that matches who you are and who you want to be.
          </p>
          <div className="actions">
            <button className="primary">Sign Up</button>
            <button className="secondary">Login</button>
          </div>
        </section>

        <figure className="hero-figure">
          <img
            src={heroImage}
            alt="Stylist trimming hair for a smiling client in a salon."
          />
        </figure>
      </main>
    </div>
  )
}

export default App
