
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './styles/App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'

import RecipePage from './pages/RecipePage.jsx'

function App() {
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
      </Routes>
      
    </>
  )
}

export default App
