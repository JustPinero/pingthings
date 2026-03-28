import PackBrowser from '../components/PackBrowser'
import '../styles/retro.css'

const RETRO_CATEGORIES = ['military', 'arena', 'fantasy', 'sci-fi', 'fps', 'retro', 'ui']

export default function RetroPage() {
  return (
    <PackBrowser
      section="retro"
      sectionTitle="RETRO GAMING"
      categories={RETRO_CATEGORIES}
      themeClass="theme-retro"
    />
  )
}
