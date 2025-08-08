import '../styles/RecipeCard.css';
import { AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';


const RecipeCard = ({recipe, onClick }) => {
  const { recipes } = useContext(AuthContext)
  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-image-container">
        <img className="recipe-image" src={recipe.image || '/public/pexels-valeriya-842571.jpg'} alt={recipe.title} />
      </div>
      <h3 className="recipe-title">{recipe.title}</h3>
      <p className="recipe-description">
        {recipe.description.split(" ").slice(0, 10).join(" ")}...
      </p>
    </div>
    );
}

export default RecipeCard;