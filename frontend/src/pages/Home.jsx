import '../styles/pages/Home.css'
import Login from './Login.jsx'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react'
import ScrapeWebsiteBtn from '../components/utils/ScrapeWebsiteBtn.jsx'
import { AuthContext } from '../contexts/AuthContext.jsx';
import RecipeCarousel from '../components/pages/RecipeCarousel.jsx';
import PillNav from '../components/layout/PillNav.jsx';


const Home = () => {
  const { recipes, user, loading, fetchUserRecipes, setNavOrigin} = useContext(AuthContext)
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      fetchUserRecipes(token); // Fetch fresh recipes when component mounts
    }
  }, [user]); // Only when user changes
  
  if (loading) return <p>Loading...</p>
  if(!user) return null; //shouldn't happen due to routing guard

    const handleCardClick = (slug) =>{
    console.log('Home - handleCardClick called for slug:', slug);
    setNavOrigin('/home')
    console.log('Home - origin set to /home');
    navigate(`/recipe/${slug}`)
  }

  // Filter recipes for different carousels
  const favoriteRecipes = recipes.filter(recipe => recipe.favorite);
  
  // Filter recipes by specific tags
  const easyRecipes = recipes.filter(recipe => 
    recipe.tags && recipe.tags.some(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      return tagName.toLowerCase().includes('easy') || tagName.toLowerCase().includes('simple');
    })
  );
  
  const cheapRecipes = recipes.filter(recipe => 
    recipe.tags && recipe.tags.some(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      return tagName.toLowerCase().includes('cheap') || tagName.toLowerCase().includes('budget') || tagName.toLowerCase().includes('affordable');
    })
  );
  
  const quickRecipes = recipes.filter(recipe => 
    recipe.tags && recipe.tags.some(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      return tagName.toLowerCase().includes('quick') || tagName.toLowerCase().includes('fast') || tagName.toLowerCase().includes('30min');
    })
  );
  
  const healthyRecipes = recipes.filter(recipe => 
    recipe.tags && recipe.tags.some(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      return tagName.toLowerCase().includes('healthy') || tagName.toLowerCase().includes('low-cal') || tagName.toLowerCase().includes('diet');
    })
  );
 

  return (
    <div className="home">
      <div className="add-recipe">
        <ScrapeWebsiteBtn />
        <button onClick={() => {
          console.log('Home - Add own recipe button clicked');
          setNavOrigin('/home');
          console.log('Home - origin set to /home for new recipe');
          navigate('/recipe/new', { recipe: true });
        }} className="insert-recipe-btn">Add own recipe</button>
      </div>
      <div className="bottom-container">
        <PillNav />
        <RecipeCarousel 
          recipes={favoriteRecipes}
          title="Your Favorites"
          onCardClick={handleCardClick}
        />
        <RecipeCarousel 
          recipes={easyRecipes}
          title="Easy Recipes"
          onCardClick={handleCardClick}
        />
        <RecipeCarousel 
          recipes={cheapRecipes}
          title="Budget-Friendly"
          onCardClick={handleCardClick}
        />
        <RecipeCarousel 
          recipes={quickRecipes}
          title="Quick & Easy"
          onCardClick={handleCardClick}
        />
        <RecipeCarousel 
          recipes={healthyRecipes}
          title="Healthy Options"
          onCardClick={handleCardClick}
        />
        <RecipeCarousel 
          recipes={recipes}
          title="All Your Recipes"
          onCardClick={handleCardClick}
        />
      </div>


    </div>
  )
}

export default Home

  /* useEffect(()=>{
    const verifyToken = async() => {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`http://localhost:8000/verify-token`,{
          method: 'POST',
          headers: {
          'Authorization': `Bearer ${token}`,
          },
        });

        if(!response.ok){
          throw new Error('Token verification failed');
        }
      
      setLoading(false);
      }catch (err){
          localStorage.removeItem('token');
          navigate('/')
      }
    }
    verifyToken();
  }, [navigate]) */