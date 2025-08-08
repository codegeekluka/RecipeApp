import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Navbar from './components/NavBar.jsx'
import MyRecipes from './pages/MyRecipes.jsx'
import RecipePage from './pages/RecipePage.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

function App() {
  
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />}/>
        <Route path="/register" element={<Signup />}/>
        <Route path="/home" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
          }
        />
        <Route path="/recipe/:slug" element={
          <PrivateRoute>
            <RecipePage />
          </PrivateRoute>
          }
        />
        <Route path="/MyRecipes" element={
          <PrivateRoute>
            <MyRecipes />
          </PrivateRoute>
          }
        />
      </Routes>
      
    </>
  )
}

export default App
