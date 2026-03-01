// context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode} from 'jwt-decode';
import axios from 'axios'

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Prevent flashing
  const [recipes, setRecipes] = useState([]);
  const [origin, setOrigin] = useState(null);

  const fetchUserRecipes = useCallback(async (token) => {
    try {
  
        const response = await axios.get('http://localhost:8000/user/recipes?full_details=true', {
          headers: {Authorization: `Bearer ${token}`}
        });
        setRecipes(response.data.recipes)
        return response.data.recipes
    } catch (err){
      console.error('Failed to fetch recipes: ', err)
      setRecipes([])
      return []
    }
  }, [])

  const fetchUserProfile = useCallback(async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext - useEffect triggered, token exists:', !!token);
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const expired = decoded.exp * 1000 < Date.now();
        console.log('AuthContext - token decoded, expired:', expired, 'exp:', decoded.exp, 'current time:', Date.now());

        if (expired) {
          console.log('AuthContext - token expired, removing');
          localStorage.removeItem('token');
          setUser(null);
          setUserProfile(null);
        } else {
          console.log('AuthContext - token valid, setting user:', decoded.sub);
          setUser({ username: decoded.sub }); // You can also fetch full user info if needed
          fetchUserRecipes(token);
          fetchUserProfile(token); // Fetch user profile on mount
        }
      } catch (err) {
        console.error("AuthContext - Invalid token:", err);
        localStorage.removeItem('token');
        setUser(null);
        setUserProfile(null);
      }
    } else {
      console.log('AuthContext - no token found');
    }
    setLoading(false);
  }, [fetchUserRecipes, fetchUserProfile]);

  const login = (token) => {
    console.log('AuthContext - login called');
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser({ username: decoded.sub });
    fetchUserRecipes(token);
    fetchUserProfile(token); // Fetch user profile on login
  };

  const logout = () => {
    console.log('AuthContext - logout called');
    localStorage.removeItem('token');
    setUser(null);
    setUserProfile(null);
    setRecipes([]);
  };

  const refreshUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchUserProfile(token);
    }
  }, [fetchUserProfile]);

  const setNavOrigin = (newOrigin) => {
    setOrigin(newOrigin);
    
}

  const clearNavOrigin = () => {
    setOrigin(null);
    
}

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      refreshUserProfile,
      origin, 
      setNavOrigin,
      clearNavOrigin, 
      login, 
      logout, 
      fetchUserRecipes, 
      recipes, 
      setRecipes, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
