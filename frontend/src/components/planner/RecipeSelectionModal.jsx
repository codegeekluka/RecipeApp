import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import PlannerRecipeCard from './PlannerRecipeCard.jsx';
import TagFilter from './TagFilter.jsx';
import '../../styles/planner/RecipeSelectionModal.css';

const RecipeSelectionModal = ({ isOpen, onClose, mealType, onCreatePlan, currentMealPlan }) => {
  const { recipes, fetchUserRecipes } = useContext(AuthContext);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [filteredUserRecipes, setFilteredUserRecipes] = useState([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Recipe Selection, 2: Day Assignment
  const [dayAssignments, setDayAssignments] = useState({}); // { dateString: recipe }
  const [draggedRecipe, setDraggedRecipe] = useState(null);
  const [initialSelectedRecipes, setInitialSelectedRecipes] = useState([]);
  const [initialDayAssignments, setInitialDayAssignments] = useState({});

  // Mock suggested recipes data
  const mockSuggestedRecipes = [
    {
      id: 'suggested-1',
      title: 'Pork Street Tacos',
      image: '/pexels-valeriya-842571.jpg',
      total_time: '40 min',
      difficulty: 'Medium',
      tags: ['pork', 'mexican', 'spicy'],
      ingredients: ['pork', 'tortillas', 'onions', 'cilantro', 'lime', 'salt'],
      isSuggested: true
    },
    {
      id: 'suggested-2',
      title: 'Mediterranean Quinoa Bowl',
      image: '/pexels-valeriya-842571.jpg',
      total_time: '30 min',
      difficulty: 'Easy',
      tags: ['vegetarian', 'healthy', 'mediterranean'],
      ingredients: ['quinoa', 'tomatoes', 'cucumber', 'olives', 'feta cheese', 'olive oil'],
      isSuggested: true
    },
    {
      id: 'suggested-3',
      title: 'Beef Stir Fry',
      image: '/pexels-valeriya-842571.jpg',
      total_time: '25 min',
      difficulty: 'Easy',
      tags: ['beef', 'asian', 'quick'],
      ingredients: ['beef', 'broccoli', 'carrots', 'soy sauce', 'garlic', 'ginger'],
      isSuggested: true
    },
    {
      id: 'suggested-4',
      title: 'Fish Tacos',
      image: '/pexels-valeriya-842571.jpg',
      total_time: '35 min',
      difficulty: 'Medium',
      tags: ['fish', 'mexican', 'healthy'],
      ingredients: ['fish', 'tortillas', 'cabbage', 'avocado', 'lime', 'spices'],
      isSuggested: true
    }
  ];

  // Get next 7 days starting from today
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        name: dayNames[date.getDay()],
        date: date,
        dateString: date.toISOString().split('T')[0], // YYYY-MM-DD format
        isPast: i === 0 // Today is considered "past" for editing purposes
      });
    }
    return days;
  };

  useEffect(() => {
    if (isOpen) {
      // Reset to step 1 when modal opens
      setCurrentStep(1);
      setDayAssignments({});
      setDraggedRecipe(null);
      
      // Fetch user recipes when modal opens
      const token = localStorage.getItem('token');
      if (token && fetchUserRecipes) {
        fetchUserRecipes(token);
      }
      setSuggestedRecipes(mockSuggestedRecipes);
      
      // Pre-populate selected recipes with current meal plan for this meal type
      if (currentMealPlan && mealType) {
        const currentRecipes = [];
        const currentAssignments = {};
        Object.entries(currentMealPlan).forEach(([dateString, dayPlan]) => {
          if (dayPlan[mealType]) {
            currentRecipes.push(dayPlan[mealType]);
            currentAssignments[dateString] = dayPlan[mealType];
          }
        });
        setSelectedRecipes(currentRecipes);
        setDayAssignments(currentAssignments);
        // Store initial state for comparison
        setInitialSelectedRecipes(currentRecipes);
        setInitialDayAssignments(currentAssignments);
      } else {
        // Store empty initial state
        setInitialSelectedRecipes([]);
        setInitialDayAssignments({});
      }
    } else {
      // Re-enable scrolling when modal closes
      document.body.style.overflow = '';
    }
  }, [isOpen, fetchUserRecipes, currentMealPlan, mealType]);

  // Extract unique tags from user's recipes
  useEffect(() => {
    if (recipes && recipes.length > 0) {
      const allTags = recipes
        .filter(recipe => recipe.tags && Array.isArray(recipe.tags))
        .flatMap(recipe => recipe.tags)
        .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '');
      
      // Remove duplicates and sort alphabetically
      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } else {
      setAvailableTags([]);
    }
  }, [recipes]);

  useEffect(() => {
    // Filter user recipes based on selected tags
    if (selectedTags.length === 0) {
      setFilteredUserRecipes(recipes);
    } else {
      const filtered = recipes.filter(recipe => 
        recipe.tags && recipe.tags.some(tag => selectedTags.includes(tag))
      );
      setFilteredUserRecipes(filtered);
    }
  }, [recipes, selectedTags]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleRecipeSelect = (recipe) => {
    if (selectedRecipes.find(r => r.id === recipe.id)) {
      // Remove if already selected
      setSelectedRecipes(prev => prev.filter(r => r.id !== recipe.id));
      
      // Also remove from day assignments
      setDayAssignments(prev => {
        const newAssignments = { ...prev };
        Object.keys(newAssignments).forEach(dateString => {
          if (newAssignments[dateString]?.id === recipe.id) {
            delete newAssignments[dateString];
          }
        });
        return newAssignments;
      });
    } else {
      // Add if not selected (but only if under limit)
      if (selectedRecipes.length >= 7) {
        return; // Maximum 7 recipes
      }
      setSelectedRecipes(prev => [...prev, recipe]);
    }
  };

  // Check if there are actual changes from the initial state
  const hasChanges = () => {
    // Check if selected recipes have changed
    const recipesChanged = selectedRecipes.length !== initialSelectedRecipes.length ||
      !selectedRecipes.every(recipe => 
        initialSelectedRecipes.some(initialRecipe => initialRecipe.id === recipe.id)
      );
    
    // Check if day assignments have changed
    const assignmentsChanged = Object.keys(dayAssignments).length !== Object.keys(initialDayAssignments).length ||
      !Object.entries(dayAssignments).every(([dateString, recipe]) => 
        initialDayAssignments[dateString]?.id === recipe?.id
      );
    
    return recipesChanged || assignmentsChanged;
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setSelectedRecipes([]);
    setSelectedTags([]);
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (selectedRecipes.length > 0) {
      setCurrentStep(2);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(1);
  };

  // Drag and drop functions
  const handleDragStart = (e, recipe) => {
    setDraggedRecipe(recipe);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create custom drag image with book icon
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 3px solid white;
    `;
    
    // Add book SVG icon
    dragImage.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    `;
    
    // Position off-screen
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 30, 30);
    
    // Clean up after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
    
    // Prevent scrolling on mobile during drag
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = () => {
    setDraggedRecipe(null);
    // Re-enable scrolling
    document.body.style.overflow = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dateString) => {
    e.preventDefault();
    
    if (!draggedRecipe) return;
    
    const next7Days = getNext7Days();
    const day = next7Days.find(d => d.dateString === dateString);
    
    // Check if day is in the past
    if (day && day.isPast) {
      setDraggedRecipe(null);
      document.body.style.overflow = '';
      return;
    }
    
    // Check if day already has a meal assigned
    if (dayAssignments[dateString]) {
      setDraggedRecipe(null);
      document.body.style.overflow = '';
      return; // Snap back to original position
    }
    
    // Assign recipe to day
    setDayAssignments(prev => ({
      ...prev,
      [dateString]: draggedRecipe
    }));
    
    setDraggedRecipe(null);
    document.body.style.overflow = '';
  };

  const handleRemoveFromDay = (dateString) => {
    setDayAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[dateString];
      return newAssignments;
    });
  };

  const handleCreatePlan = () => {
    if (onCreatePlan) {
      // Convert day assignments to the format expected by the parent
      const newMealPlan = {};
      Object.entries(dayAssignments).forEach(([dateString, recipe]) => {
        newMealPlan[dateString] = { [mealType]: recipe };
      });
      
      // Call the parent component's create plan handler with the structured meal plan
      // This will handle both adding new assignments and clearing removed ones
      onCreatePlan(newMealPlan, mealType);
    }
    
    // Clear selections and close modal
    setSelectedRecipes([]);
    setSelectedTags([]);
    setDayAssignments({});
    setCurrentStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            {currentStep === 2 && (
              <button className="back-button" onClick={handleBackStep}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
                Back
              </button>
            )}
            <h2>
              {currentStep === 1 
                ? `Select ${mealType === 'dinner' ? 'Dinner' : 'Lunch'} Recipes`
                : `Assign to Days`
              }
            </h2>
          </div>
          <div className="header-right">
            <div className="step-indicator">
              Step {currentStep} of 2
            </div>
            <button className="close-button" onClick={handleClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Step 1: Recipe Selection */}
        {currentStep === 1 && (
          <>
            {/* Tag Filter */}
            <div className="tag-filter-section">
              <h3>Filter by tags:</h3>
              {availableTags.length > 0 ? (
                <TagFilter
                  tags={availableTags}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                />
              ) : (
                <div className="no-tags-message">
                  <p>No tags available from your recipes.</p>
                </div>
              )}
            </div>

            {/* User Recipes Section */}
            <div className="recipes-section">
              <h3>Your Recipes</h3>
              <div className="recipe-carousel">
                {filteredUserRecipes.length > 0 ? (
                  filteredUserRecipes.map(recipe => (
                    <PlannerRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isSelected={selectedRecipes.some(r => r.id === recipe.id)}
                      onSelect={() => handleRecipeSelect(recipe)}
                    />
                  ))
                ) : (
                  <div className="no-recipes">
                    <p>No recipes found with selected tags.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Recipes Section */}
            <div className="recipes-section">
              <h3>Suggested Recipes</h3>
              <div className="recipe-carousel">
                {suggestedRecipes.map(recipe => (
                  <PlannerRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isSelected={selectedRecipes.some(r => r.id === recipe.id)}
                    onSelect={() => handleRecipeSelect(recipe)}
                  />
                ))}
              </div>
            </div>

            {/* Next Step Button */}
            <div className="modal-actions">
              <div className="selection-counter">
                {selectedRecipes.length} of 7 recipes selected
              </div>
              <button 
                className="next-step-button"
                onClick={handleNextStep}
                disabled={selectedRecipes.length === 0}
              >
                Next: Assign to Days
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Step 2: Day Assignment */}
        {currentStep === 2 && (
          <>
            
            {/* Selected Recipes (Draggable) */}
            <div className="selected-recipes-section">
              <h3>Selected Recipes</h3>
              <div className="selected-recipes-grid">
                {selectedRecipes.map(recipe => {
                  const isAssigned = Object.values(dayAssignments).some(assignedRecipe => assignedRecipe?.id === recipe.id);
                  const isDragging = draggedRecipe?.id === recipe.id;
                  
                  return (
                    <div
                      key={recipe.id}
                      className={`selected-recipe-card ${isDragging ? 'dragging' : ''} ${isAssigned ? 'assigned' : ''}`}
                      draggable={!isAssigned}
                      onDragStart={!isAssigned ? (e) => handleDragStart(e, recipe) : undefined}
                      onDragEnd={!isAssigned ? handleDragEnd : undefined}
                      style={{
                        opacity: isAssigned ? 0.5 : 1,
                        cursor: isAssigned ? 'not-allowed' : 'grab'
                      }}
                    >
                      <img src={recipe.image || '/pexels-valeriya-842571.jpg'} alt={recipe.title} />
                      <span>{recipe.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Days */}
            <div className="calendar-section">
              <h3>Weekly Calendar</h3>
              <div className="calendar-grid">
                {getNext7Days().map(day => (
                  <div
                    key={day.dateString}
                    className={`calendar-day ${day.isPast ? 'past-day' : ''} ${dayAssignments[day.dateString] ? 'has-meal' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.dateString)}
                  >
                    <div className="day-header">
                      <span className="day-name">{day.name}</span>
                      <span className="day-date">{day.date.getDate()}</span>
                    </div>
                    <div className="day-content">
                      {dayAssignments[day.dateString] ? (
                        <div className="assigned-meal">
                          <img 
                            src={dayAssignments[day.dateString].image || '/pexels-valeriya-842571.jpg'} 
                            alt={dayAssignments[day.dateString].title}
                          />
                          <span>{dayAssignments[day.dateString].title}</span>
                          {!day.isPast && (
                            <button 
                              className="remove-meal"
                              onClick={() => handleRemoveFromDay(day.dateString)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="empty-slot">
                          {day.isPast ? (
                            <span className="past-indicator">Past</span>
                          ) : (
                            <span className="drop-indicator">Drop recipe here</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Actions */}
            <div className="modal-actions">
              <button 
                className="create-plan-button"
                onClick={handleCreatePlan}
                disabled={Object.keys(dayAssignments).length === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                  <polyline points="9,11 12,14 22,4"/>
                </svg>
                Create Plan ({Object.keys(dayAssignments).length} meals)
              </button>
            </div>
          </>
        )}

        {/* Close Confirmation Modal */}
        {showCloseConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-modal">
              <h3>Unsaved Changes</h3>
              <p>You have {selectedRecipes.length} recipe(s) selected. Are you sure you want to close without saving?</p>
              <div className="confirmation-buttons">
                <button className="cancel-button" onClick={handleCancelClose}>
                  Cancel
                </button>
                <button className="confirm-button" onClick={handleConfirmClose}>
                  Close Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default RecipeSelectionModal;
