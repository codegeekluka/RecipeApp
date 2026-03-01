import '../styles/pages/Home.css'
import Login from './Login.jsx'
import { useNavigate } from 'react-router-dom';
import { useEffect, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx';
import RecipeCarousel from '../components/pages/RecipeCarousel.jsx';
import PillNav from '../components/layout/PillNav.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';


const Home = () => {
  const { recipes, user, userProfile, loading, fetchUserRecipes, setNavOrigin} = useContext(AuthContext)
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      fetchUserRecipes(token); // Fetch fresh recipes when component mounts
    }
  }, [user]); // Only when user changes
  
  if (loading) return <p>Loading...</p>
  if(!user) return null; //shouldn't happen due to routing guard

  // Helper function to construct full image URL
  const getImageUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    // If it's already a full URL, return as is
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Otherwise, prepend the backend URL
    return `http://localhost:8000${relativeUrl}`;
  };

  // Get hero image with fallbacks
  const getHeroImageStyle = () => {
    if (userProfile?.hero_image_url) {
      const fullImageUrl = getImageUrl(userProfile.hero_image_url);
      return {
        backgroundImage: `url('${fullImageUrl}')`,
        backgroundSize: '1200px 400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else {
      // Fallback to default image
      return {
        backgroundImage: `url('pexels-enginakyurt-1435895.jpg')`,
        backgroundSize: '1200px 400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
  };

  const handleCardClick = (slug) =>{
    console.log('Home - handleCardClick called for slug:', slug);
    setNavOrigin('/home')
    console.log('Home - origin set to /home');
    navigate(`/recipe/${slug}`)
  }

  const handleAddMoreClick = () => {
    navigate('/add-recipe');
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
      <div className="add-recipe" style={getHeroImageStyle()}>
        <h1>Cooking with {user.username}</h1>
        <p>Discover and create amazing recipes</p>
      </div>
      <div className="bottom-container">
        <PillNav />
        <BottomNav />
        <RecipeCarousel 
          recipes={favoriteRecipes}
          title="Your Favorites"
          onCardClick={handleCardClick}
          onAddMoreClick={handleAddMoreClick}
        />
        <RecipeCarousel 
          recipes={easyRecipes}
          title="Easy Recipes"
          onCardClick={handleCardClick}
          onAddMoreClick={handleAddMoreClick}
        />
        <RecipeCarousel 
          recipes={cheapRecipes}
          title="Budget-Friendly"
          onCardClick={handleCardClick}
          onAddMoreClick={handleAddMoreClick}
        />
        <RecipeCarousel 
          recipes={quickRecipes}
          title="Quick & Easy"
          onCardClick={handleCardClick}
          onAddMoreClick={handleAddMoreClick}
        />
        <RecipeCarousel 
          recipes={healthyRecipes}
          title="Healthy Options"
          onCardClick={handleCardClick}
          onAddMoreClick={handleAddMoreClick}
        />
        <RecipeCarousel 
          recipes={recipes}
          title="All Your Recipes"
          onCardClick={handleCardClick}
          onAddMoreClick={handleAddMoreClick}
        />
      </div>
    </div>
  );
};

export default Home