import { Link } from 'react-router-dom'
import Header from '../components/Header'
import heroImage from '../assets/hero.jpg'

function LandingPage() {
  return (
    <div className="page landing-page">
      <Header />

      <main className="hero">
        <section className="hero-copy">
          <p className="eyebrow">Welcome to your next look.</p>
          <h1>Find a look that feels like you.</h1>
          <p className="subtitle">
            Here at Beautiful Hair, we strive to help you find a unique style
            that matches who you are and who you want to be.
          </p>
          <div className="actions">
            <Link to="/register" className="button primary">
              Sign Up
            </Link>
            <Link to="/login" className="button secondary">
              Login
            </Link>
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

export default LandingPage
