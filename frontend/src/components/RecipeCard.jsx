import '../styles/RecipeCard.css';
import { useRecipesContext } from '../contexts/RecipeContext.jsx'


const RecipeCard = ({recipe, onClick }) => {
  const { recipes } = useRecipesContext()
  
  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-image-container">
        <img className="recipe-image" src={recipe.image} alt={recipe.name} />
      </div>
      <h3 className="recipe-title">{recipe.name}</h3>
      <p className="recipe-description">{recipe.description}</p>
    </div>
    );
}

export default RecipeCard;