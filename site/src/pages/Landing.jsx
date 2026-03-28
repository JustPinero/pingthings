import { Link } from 'react-router-dom'
import '../styles/landing.css'

const BASE = import.meta.env.BASE_URL

const SECTIONS = [
  {
    id: 'retro',
    title: 'RETRO GAMING',
    subtitle: '19 packs · soldiers, announcers, chiptune',
    description: 'Soldiers, announcers, explosions, chiptune bleeps. If it beeped in a 90s game, we got it.',
    emoji: null,
    image: `${BASE}images/pingthings-hero.jpg`,
  },
  {
    id: 'serene',
    title: 'SERENE',
    subtitle: '3 packs · bells, water, tones',
    description: 'Singing bowls, gentle chimes, water drops, soft tones. For when you want calm, not chaos.',
    emoji: null,
    image: null,
  },
  {
    id: 'office',
    title: 'OFFICE',
    subtitle: '4 packs · clicks, pings, paper',
    description: 'Subtle dings, keyboard clicks, email pings. The sounds your workplace won\'t judge you for.',
    emoji: null,
    image: null,
  },
  {
    id: 'nature',
    title: 'NATURE',
    subtitle: '5 packs · birds, waves, thunder',
    description: 'Bird chirps, ocean waves, thunder cracks, wolf howls. Bring the outside to your terminal.',
    emoji: null,
    image: null,
  },
]

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <h1 className="landing-title">PINGTHINGS</h1>
        <p className="landing-tagline">Terminal sound effects for everyone.</p>
        <p className="landing-sub">
          Your AI finishes a task. You hear a sound. That's it. That's the app.
          <br />
          But the sounds? The sounds are <em>really</em> good.
        </p>
        <code className="landing-install">npm install -g pingthings</code>
      </header>

      <div className="tile-grid">
        {SECTIONS.map(section => (
          <Link key={section.id} to={`/${section.id}`} className={`tile tile-${section.id}`}>
            {section.image && (
              <div className="tile-bg" style={{ backgroundImage: `url(${section.image})` }} />
            )}
            <div className="tile-content">
              <h2 className="tile-title">{section.title}</h2>
              <p className="tile-subtitle">{section.subtitle}</p>
              <p className="tile-desc">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <footer className="landing-footer">
        <p>
          <a href="https://github.com/JustPinero/pingthings">GitHub</a>
          {' · '}
          <a href="https://www.npmjs.com/package/pingthings">npm</a>
        </p>
        <p className="landing-stats">
          31 sound packs · 522 sounds · 17 themes · 6 IDE adapters · Free forever
        </p>
      </footer>
    </div>
  )
}
