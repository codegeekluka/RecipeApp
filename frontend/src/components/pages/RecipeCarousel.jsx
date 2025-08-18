import { useState, useEffect, useRef } from 'react';
import RecipeCard from './RecipeCard.jsx';
import ArrowButton from '../ui/ArrowBtn.jsx';

const RecipeCarousel = ({ recipes, title, onCardClick }) => {
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

  return (
    <div className="carousel-container">
      <h2 style={{ paddingLeft: "20px"}}>{title}</h2>
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
