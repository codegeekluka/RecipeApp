import React from 'react';
import '../styles/recipes/AddRecipePage.css';
import PillNav from '../components/layout/PillNav.jsx';

const AddRecipePage = () => {
  return (
    <div className="add-recipe-page">
      <div className="add-recipe-hero">
        <h1>Add New Recipe</h1>
        <p>Create your own delicious recipe</p>
      </div>
      <PillNav />
      <div className="add-recipe-content">
        <p>Recipe creation functionality coming soon...</p>
      </div>
    </div>
  );
};

export default AddRecipePage;
