import RecipeCard from '../components/RecipeCard.jsx'
import '../styles/Home.css'
import { useNavigate } from 'react-router-dom';
import { useRecipesContext } from '../contexts/RecipeContext.jsx'
import { useState } from 'react'

const Home = () => {
  const { recipes } = useRecipesContext()
  const [inputValue, setInputValue] = useState('')
  

  const navigate = useNavigate();

  const handleCardClick = (id) =>{
    navigate(`/recipe/${id}`)
  }

  const scrapeWebsite = async () =>{
    //need to send request to our FastAPI backend, running on port 8000
    const response = await fetch('http://localhost:8000/RecipePage', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: inputValue }),
    });
    if (response.ok) {
      const data = await response.json();
      console.log(data)
    } else {
      console.error("Failed to extract recipe");
    }


  }

  return (
    <div className="home">
        <div className="top-section">
          <input
          type="text"
          className="enter-recipe"  
          placeholder="Enter URL" 
          value={inputValue}
          onChange={(e)=> setInputValue(e.target.value)}
          />
          <button onClick={scrapeWebsite}>➔</button>
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
      <hr className="divider" />
      <div className="add-recipe">
        <button className="insert-recipe-btn">Add Recipe</button>
      </div>
    </div>
  )
}

export default Home