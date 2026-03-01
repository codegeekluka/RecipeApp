import { useState, useEffect, useContext } from "react";
import { FavoriteIcon } from "../ui/Icons";
import { toggleFavorite } from "../../services/toggleFavorite";
import '../../styles/recipes/RecipeHero.css'
import DeleteButton from '../ui/DeleteButton';
import EditButton from '../ui/EditButton';
import ReturnBtn from '../ui/ReturnBtn';
import TagsManager from "../ui/AddTags";
import TagsPills from "../ui/TagsPills";
import { AuthContext } from "../../contexts/AuthContext";
import ComingSoonModal from "../ui/ComingSoonModal";

export default function RecipeHero({ recipe, tags, onAddTag, onRemoveTag, editMode, startEditing, saveRecipe, cancelEditing, navigate }) {
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite || false);
  const [showShareModal, setShowShareModal] = useState(false);
  const token = localStorage.getItem("token");
  const { origin, clearNavOrigin } = useContext(AuthContext)

 
  const handleFavoriteClick = async () => {
    try {
      const newStatus = await toggleFavorite(recipe.slug, token);
      setIsFavorite(newStatus);
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
        <button className="icon-button" onClick={() => setShowShareModal(true)} title="Share Recipe">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>}

      <ComingSoonModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Coming Soon"
        message="Share your recipes with your friends!"
      />
    </div>
  );
}
