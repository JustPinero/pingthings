import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const BASE = import.meta.env.BASE_URL
const EVENTS = ['done', 'permission', 'complete', 'error', 'blocked']

export default function PackBrowser({ section, sectionTitle, categories, themeClass }) {
  const [packs, setPacks] = useState([])
  const [themes, setThemes] = useState({})
  const [category, setCategory] = useState('all')
  const [playing, setPlaying] = useState(null)
  const audioRef = useRef(new Audio())

  useEffect(() => {
    fetch(`${BASE}packs.json`).then(r => r.json()).then(data => {
      const filtered = data.filter(p => categories.includes(p.category))
      setPacks(filtered)
    })
    fetch(`${BASE}themes.json`).then(r => r.json()).then(setThemes)
  }, [])

  const activeCats = ['all', ...new Set(packs.map(p => p.category).filter(Boolean))].sort()
  const filtered = category === 'all' ? packs : packs.filter(p => p.category === category)
  const totalSounds = packs.reduce((s, p) => s + p.soundCount, 0)

  function playEvent(packName, event) {
    const key = `${packName}/${event}`
    setPlaying(key)
    audioRef.current.src = `${BASE}audio/${packName}/${event}.mp3`
    audioRef.current.play().catch(() => {})
    setTimeout(() => setPlaying(null), 1500)
  }

  return (
    <div className={`page-wrapper ${themeClass}`}>
      <nav className="page-nav">
        <Link to="/" className="back-link">PINGTHINGS</Link>
      </nav>

      <header className="page-header">
        <h1 className="page-title">{sectionTitle}</h1>
        <p className="page-stats">
          {packs.length} packs · {totalSounds} sounds
        </p>
      </header>

      <section className="page-section">
        <div className="category-tabs">
          {activeCats.map(cat => (
            <button
              key={cat}
              className={`category-tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="pack-grid">
          {filtered.map(pack => (
            <div key={pack.name} className="pack-card">
              <div className="pack-name">{pack.name}</div>
              <div className="pack-meta">
                <span className="pack-category">{pack.category}</span>
                <span className="pack-license">{pack.soundCount} sounds</span>
              </div>
              <div className="pack-description">{pack.description}</div>
              <div className="event-buttons">
                {EVENTS.map(event => (
                  <button
                    key={event}
                    className={`event-btn ${event} ${playing === `${pack.name}/${event}` ? 'playing' : ''}`}
                    onClick={() => playEvent(pack.name, event)}
                  >
                    {event.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {packs.length === 0 && (
          <div className="coming-soon">
            <p>Sound packs coming soon!</p>
            <p>We're sourcing open-source sounds for this section.</p>
          </div>
        )}
      </section>

      <footer className="page-footer">
        <Link to="/">Back to all sections</Link>
        {' · '}
        <a href="https://github.com/JustPinero/pingthings">GitHub</a>
        {' · '}
        <a href="https://www.npmjs.com/package/pingthings">npm</a>
      </footer>
    </div>
  )
}
