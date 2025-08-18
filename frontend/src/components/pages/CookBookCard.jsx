import React from "react";
import PropTypes from "prop-types";
import "../../styles/recipes/CookbookCard.css";

export default function CookBookCard({ recipe, onClick }) {
  return (
    <div className="my-recipe-card" onClick={onClick}>
      <div className="my-recipe-card-image">
        <img src={recipe.image || '/pexels-valeriya-842571.jpg'} alt={recipe.title} />
      </div>

      <h3 className="my-recipe-card-title">{recipe.title.length > 30 ? recipe.title.substring(0, 30) + "..." : recipe.title}</h3>
    </div>
  );
}

CookBookCard.propTypes = {
  recipe: PropTypes.shape({
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    slug: PropTypes.string.isRequired,
  }).isRequired,
};
