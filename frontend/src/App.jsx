import './styles/App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

import RecipePage from './pages/RecipePage.jsx'

function App() {
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
      </Routes>
      
    </>
  )
}

export default App
