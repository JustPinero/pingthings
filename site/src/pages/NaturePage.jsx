import PackBrowser from '../components/PackBrowser'
import '../styles/nature.css'

const NATURE_CATEGORIES = ['animals', 'ocean', 'night', 'weather', 'forest']

export default function NaturePage() {
  return (
    <PackBrowser
      section="nature"
      sectionTitle="NATURE"
      categories={NATURE_CATEGORIES}
      themeClass="theme-nature"
    />
  )
}
