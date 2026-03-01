import React, { useState, useEffect } from 'react';
import '../../styles/planner/PlannerRecipeCard.css';

const PlannerRecipeCard = ({ recipe, isSelected, onSelect }) => {
  const [ingredientStats, setIngredientStats] = useState({ available: 0, missing: 0, showIndicators: false });

  // Function to check ingredient availability
  const checkIngredientAvailability = () => {
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const fridgeItems = JSON.parse(localStorage.getItem('fridgeItems') || '[]');
      
      // Only show indicators if user has items in their fridge
      if (fridgeItems.length === 0) {
        setIngredientStats({ available: 0, missing: 0, showIndicators: false });
        return;
      }
      
      const fridgeItemNames = fridgeItems.map(item => item.name.toLowerCase());
      
      let available = 0;
      let missing = 0;
      
      recipe.ingredients.forEach(ingredient => {
        const ingredientLower = ingredient.toLowerCase().trim();
        const hasIngredient = fridgeItemNames.some(fridgeItem => {
          const fridgeItemLower = fridgeItem.toLowerCase().trim();
          // More flexible matching - check if ingredient is contained in fridge item or vice versa
          return fridgeItemLower.includes(ingredientLower) || 
                 ingredientLower.includes(fridgeItemLower) ||
                 fridgeItemLower === ingredientLower;
        });
        
        if (hasIngredient) {
          available++;
        } else {
          missing++;
        }
      });
      
      setIngredientStats({ available, missing, showIndicators: true });
    } else {
      setIngredientStats({ available: 0, missing: 0, showIndicators: false });
    }
  };

  // Check ingredient availability against fridge items
  useEffect(() => {
    checkIngredientAvailability();
  }, [recipe.ingredients]);

  // Listen for changes to fridge items in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'fridgeItems') {
        checkIngredientAvailability();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleFridgeUpdate = () => {
      checkIngredientAvailability();
    };
    
    window.addEventListener('fridgeUpdated', handleFridgeUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fridgeUpdated', handleFridgeUpdate);
    };
  }, [recipe.ingredients]);
  return (
    <div 
      className={`planner-recipe-card ${isSelected ? 'selected' : ''}`} 
      onClick={onSelect}
    >
      <div className="recipe-image-container">
        <img 
          className="recipe-image" 
          src={recipe.image || '/pexels-valeriya-842571.jpg'} 
          alt={recipe.title} 
        />
        <button className={`add-button ${isSelected ? 'selected' : ''}`}>
          {isSelected ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7,12 10,15 17,8"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
        </button>
      </div>
      <div className="recipe-content">
        <h3 className="recipe-title">{recipe.title}</h3>
        <div className="recipe-details">
          <span className="prep-time">{recipe.total_time || "N/A"}</span>
        </div>
        
        {/* Ingredient Availability Indicators */}
        {recipe.ingredients && recipe.ingredients.length > 0 && ingredientStats.showIndicators && (
          <div className="ingredient-availability">
            <div className="ingredient-stat available">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,11 12,14 22,4"/>
              </svg>
              <span>{ingredientStats.available}</span>
            </div>
            <div className="ingredient-stat missing">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span>{ingredientStats.missing}</span>
            </div>
          </div>
        )}
        
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-tags">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="tag more-tags">+{recipe.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlannerRecipeCard;
