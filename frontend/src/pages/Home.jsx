import RecipeCard from '../components/RecipeCard.jsx'
import '../styles/Home.css'
import Login from './Login.jsx'
import { useNavigate } from 'react-router-dom';
import { useRecipesContext } from '../contexts/RecipeContext.jsx'
import { useState, useEffect } from 'react'
import ScrapeWebsiteBtn from '../components/ScrapeWebsiteBtn.jsx'


const Home = () => {


  const { recipes } = useRecipesContext()
  
  const [loading, setLoading] =useState(true)

  const navigate = useNavigate();

  useEffect(()=>{
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
  }, [navigate])

  


  const handleCardClick = (id) =>{
    navigate(`/recipe/${id}`)
  }

  
  

  return (
    <div className="home">
        <div className="add-recipe">
          <ScrapeWebsiteBtn />
            <button className="insert-recipe-btn">Add own recipe</button>
        </div>
        <hr className="divider" />
        <h2>Your Recipes</h2>
        <div className="recipe-list">
          {recipes.map(recipe => (
            <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={()=> handleCardClick(recipe.id)}
            />
          ))}
        </div>
      
    </div>
  )
}

export default Home