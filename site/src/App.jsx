import { useState, useEffect, useRef } from 'react'

const BASE = import.meta.env.BASE_URL
const EVENTS = ['done', 'permission', 'complete', 'error', 'blocked']
const CAT_ICONS = {
  military: 'pingthings-cat-military.jpg',
  arena: 'pingthings-cat-arena.jpg',
  fantasy: 'pingthings-cat-fantasy.jpg',
  'sci-fi': 'pingthings-cat-scifi.jpg',
  fps: 'pingthings-cat-fps.jpg',
  retro: 'pingthings-cat-retro.jpg',
  ui: 'pingthings-cat-ui.jpg',
}

function App() {
  const [packs, setPacks] = useState([])
  const [themes, setThemes] = useState({})
  const [category, setCategory] = useState('all')
  const [playing, setPlaying] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTheme, setActiveTheme] = useState(null)
  const audioRef = useRef(new Audio())

  useEffect(() => {
    fetch(`${BASE}packs.json`).then(r => r.json()).then(setPacks)
    fetch(`${BASE}themes.json`).then(r => r.json()).then(setThemes)
  }, [])

  const categories = ['all', ...new Set(packs.map(p => p.category).filter(Boolean))].sort()
  const filtered = category === 'all' ? packs : packs.filter(p => p.category === category)
  const totalSounds = packs.reduce((s, p) => s + p.soundCount, 0)

  function playEvent(packName, event) {
    const key = `${packName}/${event}`
    setPlaying(key)
    audioRef.current.src = `${BASE}audio/${packName}/${event}.mp3`
    audioRef.current.play().catch(() => {})
    setTimeout(() => setPlaying(null), 1500)
  }

  function playThemeEvent(event) {
    if (!activeTheme || !themes[activeTheme]) return
    const packName = themes[activeTheme].eventPacks[event]
    playEvent(packName, event)
  }

  function copyInstall() {
    navigator.clipboard.writeText('npm install -g pingthings')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="hero-image">
        <img src={`${BASE}images/pingthings-hero.jpg`} alt="pingthings - pixel art terminal with sound waves" />
      </div>

      <header className="header">
        <h1>PINGTHINGS</h1>
        <p className="tagline">
          YOUR TERMINAL JUST GOT AN UPGRADE.
        </p>
        <p className="subtitle">
          Remember when you got that new toy and you HAD to show everyone?
          That's this. Except the toy makes your CLI go *DING* and *WHOOSH*
          and *EXCELLENT!* every time your AI finishes a task.
          It's the most fun you'll have installing an npm package. We promise.
        </p>
        <div className="install-box pixel-border" onClick={copyInstall}>
          {copied
            ? <span className="copied">COPIED TO CLIPBOARD!</span>
            : <span>$ npm install -g pingthings</span>
          }
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <div className="stat-value">{packs.length}</div>
          <div className="stat-label">Sound Packs</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totalSounds}</div>
          <div className="stat-label">Total Sounds</div>
        </div>
        <div className="stat">
          <div className="stat-value">{Object.keys(themes).length}</div>
          <div className="stat-label">Themes</div>
        </div>
        <div className="stat">
          <div className="stat-value">$0</div>
          <div className="stat-label">Forever</div>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">SOUND PACKS</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          Click any event button to hear what it sounds like. Go ahead. We'll wait.
        </p>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CAT_ICONS[cat] && <img src={`${BASE}images/${CAT_ICONS[cat]}`} alt="" className="cat-icon" />}
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="pack-grid">
          {filtered.map(pack => (
            <div key={pack.name} className="pack-card pixel-border">
              <div className="pack-name">{pack.name}</div>
              <div className="pack-meta">
                <span className="pack-category">{pack.category}</span>
                <span className="pack-license">{pack.soundCount} sounds / {pack.license}</span>
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
      </section>

      <section className="section">
        <h2 className="section-title">THEMES</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          One command. Instant vibe. Each theme maps different packs to different events.
          Pick one and hear the whole experience.
        </p>

        <div className="theme-grid">
          {Object.entries(themes).map(([name, theme]) => (
            <div
              key={name}
              className={`theme-card pixel-border ${activeTheme === name ? 'active' : ''}`}
              onClick={() => setActiveTheme(activeTheme === name ? null : name)}
            >
              <div className="theme-name">{name.toUpperCase()}</div>
              <div className="theme-desc">{theme.description}</div>
              {activeTheme === name && (
                <>
                  <div className="event-buttons" style={{ marginTop: '0.8rem' }}>
                    {EVENTS.map(event => (
                      <button
                        key={event}
                        className={`event-btn ${event} ${playing === `${theme.eventPacks[event]}/${event}` ? 'playing' : ''}`}
                        onClick={(e) => { e.stopPropagation(); playThemeEvent(event) }}
                      >
                        {event.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="theme-command" onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(`pingthings theme ${name}`)
                  }}>
                    $ pingthings theme {name}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">HOW IT WORKS</h2>
        <div className="pack-card pixel-border" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            1. Install it
          </p>
          <div className="theme-command">$ npm install -g pingthings</div>
          <p style={{ fontSize: '1.2rem', margin: '1.5rem 0 1rem' }}>
            2. Set up Claude Code hooks
          </p>
          <div className="theme-command">$ pingthings init</div>
          <p style={{ fontSize: '1.2rem', margin: '1.5rem 0 1rem' }}>
            3. Pick your vibe
          </p>
          <div className="theme-command">$ pingthings theme retro</div>
          <p style={{ fontSize: '1.2rem', margin: '1.5rem 0 0' }}>
            4. Code. Every time Claude finishes, you'll know.{' '}
            <span style={{ color: 'var(--neon-green)' }}>With style.</span>
          </p>
        </div>
      </section>

      <footer className="footer">
        <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.6rem', color: 'var(--neon-green)', marginBottom: '1rem' }}>
          BUILT WITH LOVE AND OPEN SOURCE GAME SOUNDS
        </p>
        <p>
          <a href="https://github.com/JustPinero/pingthings">GitHub</a>
          {' '}&middot;{' '}
          <a href="https://www.npmjs.com/package/pingthings">npm</a>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          All audio sourced from open source games under GPL/BSD/CC-compatible licenses.
        </p>
        <p style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          Zero dependencies. {packs.length} packs. {totalSounds} sounds. Free forever.
        </p>
      </footer>
    </>
  )
}

export default App
