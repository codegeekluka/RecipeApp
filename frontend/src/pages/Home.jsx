import RecipeCard from '../components/RecipeCard.jsx'
import '../styles/Home.css'
import Login from './Login.jsx'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react'
import ScrapeWebsiteBtn from '../components/ScrapeWebsiteBtn.jsx'
import { AuthContext } from '../contexts/AuthContext.jsx';
import ArrowButton from '../components/ArrowBtn.jsx';


const Home = () => {
  const { recipes, user, loading, fetchUserRecipes} = useContext(AuthContext)
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      fetchUserRecipes(token); // Fetch fresh recipes when component mounts
    }
  }, [user]); // Only when user changes

  if (loading) return <p>Loading...</p>
  if(!user) return null; //shouldn't happen due to routing guard

  const handleCardClick = (slug) =>{
    navigate(`/recipe/${slug}`)
  }
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 600; // Adjust as needed, width of cards + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
 

  return (
    <div className="home">
      <div className="add-recipe">
        <ScrapeWebsiteBtn />
        <button onClick={()=>navigate('/recipe/new', { recipe: true})} className="insert-recipe-btn">Add own recipe</button>
      </div>
      <div className="bottom-container">
        <h2>Your Recipes</h2>
        <div style={{ display: "flex", alignItems: "center" }}>
          <ArrowButton direction="left" onClick={() => handleScroll("left")}/>
          <div className="recipe-list" ref={scrollRef} style={{ flexGrow: 1 }}>
            {recipes.length === 0 ? (
              <p>No recipes found.</p>
            ) : (
              recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleCardClick(recipe.slug)}
                />
              ))
            )}
          </div>
          <ArrowButton direction="right" onClick={() => handleScroll("right")}/>
        </div>
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