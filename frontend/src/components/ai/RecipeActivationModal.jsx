import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import PlannerRecipeCard from '../planner/PlannerRecipeCard.jsx';
import { toggleActive } from '../../services/toggleActive.js';
import '../../styles/planner/RecipeSelectionModal.css';

const RecipeActivationModal = ({ isOpen, onClose, onRecipeActivated }) => {
  const { recipes, fetchUserRecipes } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch user recipes when modal opens
      const token = localStorage.getItem('token');
      if (token && fetchUserRecipes) {
        fetchUserRecipes(token);
      }
      setSearchQuery('');
    }
  }, [isOpen, fetchUserRecipes]);

  // Filter recipes based on search query
  useEffect(() => {
    if (!recipes || recipes.length === 0) {
      setFilteredRecipes([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = recipes.filter(recipe =>
        recipe.title?.toLowerCase().includes(query)
      );
      setFilteredRecipes(filtered);
    }
  }, [recipes, searchQuery]);

  const handleRecipeClick = async (recipe) => {
    if (isActivating) return;
    
    // If recipe is already active, don't do anything
    if (recipe.is_active) {
      onClose();
      return;
    }
    
    setIsActivating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to activate recipes');
        return;
      }

      // Activate the selected recipe (toggleActive will activate if not active)
      await toggleActive(recipe.slug, token);
      
      // Refresh recipes to get updated active status
      if (fetchUserRecipes) {
        await fetchUserRecipes(token);
      }

      // Notify parent component
      if (onRecipeActivated) {
        onRecipeActivated(recipe);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to activate recipe:', error);
      if (error.response?.status === 403) {
        alert('Session expired. Please login again.');
      } else {
        alert('Failed to activate recipe. Please try again.');
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <h2>Select Recipe to Activate</h2>
          </div>
          <div className="header-right">
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="tag-filter-section">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search recipes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-button"
                onClick={() => setSearchQuery('')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Recipes Section */}
        <div className="recipes-section">
          <h3>Your Recipes</h3>
          <div className="recipe-carousel">
            {filteredRecipes.length === 0 ? (
              <div className="no-recipes">
                <p>{searchQuery ? 'No recipes found matching your search.' : 'No recipes available.'}</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <div key={recipe.id || recipe.slug} className="recipe-card-wrapper">
                  <PlannerRecipeCard
                    recipe={recipe}
                    isSelected={recipe.is_active}
                    onSelect={() => handleRecipeClick(recipe)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecipeActivationModal;

