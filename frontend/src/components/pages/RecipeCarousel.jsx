import { useState, useEffect, useRef } from 'react';
import RecipeCard from './RecipeCard.jsx';
import ArrowButton from '../ui/ArrowBtn.jsx';

// Add More Card Component
const AddMoreCard = ({ tagType, onClick }) => {
  const getTagText = (title) => {
    switch (title) {
      case "Your Favorites":
        return "favorite";
      case "Easy Recipes":
        return "easy";
      case "Budget-Friendly":
        return "cheap";
      case "Quick & Easy":
        return "quick";
      case "Healthy Options":
        return "healthy";
      case "All Your Recipes":
        return "recipe";
      default:
        return "recipe";
    }
  };

  const tagText = getTagText(tagType);

  return (
    <div className="add-more-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="add-more-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <p className="add-more-text">Add more {tagText} recipes</p>
    </div>
  );
};

const RecipeCarousel = ({ recipes, title, onCardClick, onAddMoreClick }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      // Add event listener for scroll
      currentRef.addEventListener('scroll', updateArrowVisibility);
      // Initial check for arrow visibility
      updateArrowVisibility();
      // Cleanup event listener on unmount
      return () => {
        currentRef.removeEventListener('scroll', updateArrowVisibility);
      };
    }
  }, [recipes]); // Re-run when recipes change

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 600; // Adjust as needed, width of cards + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const updateArrowVisibility = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const isAtStart = scrollLeft <= 0;
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth;
      
      setShowLeftArrow(!isAtStart);
      setShowRightArrow(!isAtEnd);
    }
  };

  if (!recipes || recipes.length === 0) {
    return null; // Don't render carousel if no recipes
  }

  const shouldShowAddMore = recipes.length < 4;

  return (
    <div className="carousel-container">
      <h2>{title}</h2>
      <div style={{ display: "flex", alignItems: "center" }}>
        <ArrowButton 
          direction="left" 
          onClick={() => handleScroll("left")}
          style={{ visibility: showLeftArrow ? 'visible' : 'hidden' }}
        />
        <div className="recipe-list" ref={scrollRef} style={{ flexGrow: 1 }}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => onCardClick(recipe.slug)}
            />
          ))}
          {shouldShowAddMore && (
            <AddMoreCard tagType={title} onClick={onAddMoreClick} />
          )}
        </div>
        <ArrowButton 
          direction="right" 
          onClick={() => handleScroll("right")}
          style={{ visibility: showRightArrow ? 'visible' : 'hidden' }}
        />
      </div>
    </div>
  );
};

export default RecipeCarousel;
