import PackBrowser from '../components/PackBrowser'
import '../styles/office.css'

const OFFICE_CATEGORIES = ['minimal', 'mechanical', 'digital', 'classic']

export default function OfficePage() {
  return (
    <PackBrowser
      section="office"
      sectionTitle="OFFICE"
      categories={OFFICE_CATEGORIES}
      themeClass="theme-office"
    />
  )
}
