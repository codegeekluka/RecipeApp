import React from 'react';
import { useNavigate } from 'react-router-dom';

const AiPageRecipeCard = ({ 
  activeRecipe, 
  isLoadingActiveRecipe, 
  onStartCooking, 
  isLoading 
}) => {
  const navigate = useNavigate();

  if (isLoadingActiveRecipe) {
    return (
      <div className="centered-recipe-card">
        <div className="recipe-loading">
          <div className="loading-spinner"></div>
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!activeRecipe) {
    return (
      <div className="centered-recipe-card">
        <div className="no-recipe-state">
          <div className="no-recipe-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3>No Active Recipe</h3>
          <p>Select a recipe to start cooking</p>
          <button 
            className="browse-recipes-button"
            onClick={() => navigate('/MyRecipes')}
          >
            Browse Recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="centered-recipe-card">
      <div className="ai-recipe-image-container">
        {activeRecipe.image ? (
          <img 
            src={activeRecipe.image} 
            alt={activeRecipe.title} 
            className="ai-recipe-image"
          />
        ) : (
          <div className="ai-recipe-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        )}
      </div>
      
      <div className="ai-recipe-content">
        <h3 className="ai-recipe-title">{activeRecipe.title}</h3>
        
        <div className="ai-recipe-meta">
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span>{activeRecipe.ingredients?.length || 0} ingredients</span>
          </div>
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>{activeRecipe.instructions?.length || 0} steps</span>
          </div>
        </div>
        
        <button 
          className="start-cooking-button"
          onClick={() => onStartCooking(activeRecipe.id)}
          disabled={isLoading || !activeRecipe}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Start Session
        </button>
      </div>
    </div>
  );
};

export default AiPageRecipeCard;
