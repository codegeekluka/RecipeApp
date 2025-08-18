import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/layout/PillNav.css';

const PillNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [gliderStyle, setGliderStyle] = useState({});
  const [previousPath, setPreviousPath] = useState(null);
  const homeRef = useRef(null);
  const myRecipesRef = useRef(null);
  const addRecipeRef = useRef(null);
  const cheffyRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Track previous path for smooth transitions
  useEffect(() => {
    if (location.pathname !== previousPath && previousPath !== null) {
      // This is a navigation between tabs, not initial load
      setPreviousPath(location.pathname);
    } else if (previousPath === null) {
      // This is the initial load
      setPreviousPath(location.pathname);
    }
  }, [location.pathname, previousPath]);

  useEffect(() => {
    const updateGlider = () => {
      let activeButton = null;
      let position = 0;

      if (isActive('/home') && homeRef.current) {
        activeButton = homeRef.current;
        position = 0;
      } else if (isActive('/MyRecipes') && myRecipesRef.current) {
        activeButton = myRecipesRef.current;
        position = homeRef.current ? homeRef.current.offsetWidth + 4 : 0;
      } else if (isActive('/add-recipe') && addRecipeRef.current) {
        activeButton = addRecipeRef.current;
        position = (homeRef.current ? homeRef.current.offsetWidth + 4 : 0) + 
                   (myRecipesRef.current ? myRecipesRef.current.offsetWidth + 4 : 0);
      } else if (isActive('/cheffy') && cheffyRef.current) {
        activeButton = cheffyRef.current;
        position = (homeRef.current ? homeRef.current.offsetWidth + 4 : 0) + 
                   (myRecipesRef.current ? myRecipesRef.current.offsetWidth + 4 : 0) +
                   (addRecipeRef.current ? addRecipeRef.current.offsetWidth + 4 : 0);
      }

      if (activeButton) {
          setGliderStyle({
            transform: `translateX(${position}px)`,
            width: `${activeButton.offsetWidth}px`,
            height: `${activeButton.offsetHeight}px`,
          });
        } 
    };

    updateGlider();
    window.addEventListener('resize', updateGlider);
    return () => window.removeEventListener('resize', updateGlider);
  }, [location.pathname, previousPath]);

  return (
    <div className="pill-nav-container">
      <nav className="pill-nav">
        <button
          ref={homeRef}
          className={`pill-nav-item ${isActive('/home') ? 'active' : ''}`}
          onClick={() => navigate('/home')}
        >
          Home
        </button>
        <button
          ref={myRecipesRef}
          className={`pill-nav-item ${isActive('/MyRecipes') ? 'active' : ''}`}
          onClick={() => navigate('/MyRecipes')}
        >
          My Recipes
        </button>
        <button
          ref={addRecipeRef}
          className={`pill-nav-item ${isActive('/add-recipe') ? 'active' : ''}`}
          onClick={() => navigate('/add-recipe')}
        >
          Add Recipe
        </button>
        <button
          ref={cheffyRef}
          className={`pill-nav-item ${isActive('/cheffy') ? 'active' : ''}`}
          onClick={() => navigate('/cheffy')}
        >
          Cheffy
        </button>
        <span 
          className="glider" 
          style={gliderStyle}
        ></span>
      </nav>
    </div>
  );
};

export default PillNav;
