import { useState, useEffect, useContext } from "react";
import { FavoriteIcon, ActiveIcon } from "../ui/Icons";
import { toggleFavorite } from "../../services/toggleFavorite";
import { toggleActive } from "../../services/toggleActive";
import '../../styles/recipes/RecipeHero.css'
import DeleteButton from '../ui/DeleteButton';
import EditButton from '../ui/EditButton';
import ReturnBtn from '../ui/ReturnBtn';
import TagsManager from "../ui/AddTags";
import TagsPills from "../ui/TagsPills";
import { AuthContext } from "../../contexts/AuthContext";

export default function RecipeHero({ recipe, tags, onAddTag, onRemoveTag, editMode, startEditing, saveRecipe, cancelEditing, navigate }) {
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite || false);
  const [isActive, setIsActive] = useState(recipe.is_active || false);
  const token = localStorage.getItem("token");
  const { origin, clearNavOrigin } = useContext(AuthContext)

 
  const handleFavoriteClick = async () => {
    try {
      const newStatus = await toggleFavorite(recipe.slug, token);
      setIsFavorite(newStatus);
    } catch {}
  };

  const handleActiveClick = async () => {
    try {
      const newStatus = await toggleActive(recipe.slug, token);
      setIsActive(newStatus);
    } catch {}
  };

  return (
    <div className="recipe-hero">
      <img src={recipe.image || '/pexels-valeriya-842571.jpg'} alt="Recipe" />

      <div className="top-buttons">
        {!editMode ? (
          <>
            <ReturnBtn onClick={() => {
                console.log('RecipeHero - ReturnBtn clicked, origin:', origin);
                console.log('RecipeHero - token before navigation:', !!localStorage.getItem('token'));
                
                if (origin === '/home') {
                    console.log('RecipeHero - navigating to /home');
                    navigate('/home');
                } else if (origin === '/MyRecipes') {
                    console.log('RecipeHero - navigating to /MyRecipes');
                    navigate('/MyRecipes');
                } else {
                    console.log('RecipeHero - navigating to /home (fallback)');
                    navigate('/home'); // Fallback to home instead of login page
                }
                
                console.log('RecipeHero - clearing nav origin');
                clearNavOrigin(); // Clear origin after navigating
                
                console.log('RecipeHero - token after navigation:', !!localStorage.getItem('token'));
            }}  />
            <EditButton onClick={startEditing} />
            <DeleteButton />
          </>
        ) : (
          <>
            <button onClick={saveRecipe} className="save-button button-base">Save</button>
            <button onClick={cancelEditing} className="cancel-button button-base">Cancel</button>
          </>
        )}
      </div>

      <TagsPills tags={tags} onRemoveTag={onRemoveTag} editMode={editMode} />

      {!(editMode && recipe.slug === "new") && <div className="bottom-right-buttons">
        <TagsManager
            tags={tags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
        />
        <button className="icon-button" onClick={handleFavoriteClick} title={isFavorite ? "Unfavorite" : "Favorite"}>
          <FavoriteIcon active={isFavorite} />
        </button>
        <button className="icon-button" onClick={handleActiveClick} title={isActive ? "Deactivate" : "Activate"}>
          <ActiveIcon active={isActive} />
        </button>
      </div>}
    </div>
  );
}
