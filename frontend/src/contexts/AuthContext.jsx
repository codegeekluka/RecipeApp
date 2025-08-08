// context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { jwtDecode} from 'jwt-decode';
import axios from 'axios'

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevent flashing
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const expired = decoded.exp * 1000 < Date.now();

        if (expired) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser({ username: decoded.sub }); // You can also fetch full user info if needed
          fetchUserRecipes(token)        
        }
      } catch (err) {
        console.error("Invalid token");
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);


  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser({ username: decoded.sub });
    fetchUserRecipes(token);
  
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRecipes([]);
  };

  const fetchUserRecipes = async (token) => {
    try {
        const response = await axios.get('http://localhost:8000/user/recipes', {
          headers: {Authorization: `Bearer ${token}`}
        });
        setRecipes(response.data.recipes)
    } catch (err){
      console.error('Failed to fetch recipes: ', err)
      setRecipes([])
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchUserRecipes, recipes, setRecipes, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
