import { useState, useEffect } from "react";
import { FavoriteIcon, ActiveIcon } from "./Icons";
import { toggleFavorite } from "../services/toggleFavorite";
import { toggleActive } from "../services/toggleActive";
import '../styles/RecipeHero.css'
import DeleteButton from '../components/DeleteButton';
import EditButton from '../components/EditButton';
import ReturnBtn from '../components/ReturnBtn';
import TagsManager from "./AddTags";
import TagsPills from "./TagsPills";
import { updateTags } from "../services/tagsManger";

export default function RecipeHero({ recipe, tags, onAddTag, onRemoveTag, editMode, startEditing, saveRecipe, cancelEditing, navigate }) {
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite || false);
  const [isActive, setIsActive] = useState(recipe.is_active || false);
  const token = localStorage.getItem("token");

 
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
      <img src={recipe.image || '/public/pexels-valeriya-842571.jpg'} alt="Recipe" />

      <div className="top-buttons">
        {!editMode ? (
          <>
            <ReturnBtn onClick={() => navigate('/home')} />
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

      <TagsPills tags={tags} onRemoveTag={onRemoveTag} />

      <div className="bottom-right-buttons">
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
      </div>
    </div>
  );
}
