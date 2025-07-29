import { useParams } from 'react-router-dom';
import { useRecipesContext } from '../contexts/RecipeContext';

const RecipePage = () => {
  const { id } = useParams();
  const { recipes } = useRecipesContext();
  const recipe = recipes.find(r => r.id === Number(id));

  if (!recipe) return <div>Recipe not found</div>;

  return (
    <div>
      <h2>{recipe.name}</h2>
      <img src={recipe.image} alt={recipe.name} />
      <p>{recipe.description}</p>
    </div>
  );
};

export default RecipePage;