import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import RetroPage from './pages/RetroPage'
import SerenePage from './pages/SerenePage'
import OfficePage from './pages/OfficePage'
import NaturePage from './pages/NaturePage'

const BASE = import.meta.env.BASE_URL

function App() {
  return (
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/retro" element={<RetroPage />} />
        <Route path="/serene" element={<SerenePage />} />
        <Route path="/office" element={<OfficePage />} />
        <Route path="/nature" element={<NaturePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
