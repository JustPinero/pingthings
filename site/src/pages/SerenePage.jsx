import PackBrowser from '../components/PackBrowser'
import '../styles/serene.css'

const SERENE_CATEGORIES = ['bells', 'water', 'wind', 'tones']

export default function SerenePage() {
  return (
    <PackBrowser
      section="serene"
      sectionTitle="SERENE"
      categories={SERENE_CATEGORIES}
      themeClass="theme-serene"
    />
  )
}
