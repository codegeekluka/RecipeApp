import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/recipes/AddRecipePage.css';
import PillNav from '../components/layout/PillNav.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import ScrapeWebsiteBtn from '../components/utils/ScrapeWebsiteBtn.jsx';
import Fridge from '../components/fridge/Fridge.jsx';
import VideoConversionPreview from '../components/recipes/VideoConversionPreview.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';

const AddRecipePage = () => {
  const navigate = useNavigate();
  const { userProfile, setNavOrigin } = useContext(AuthContext);
  const [showFridge, setShowFridge] = useState(false);

  // Helper function to construct full image URL
  const getImageUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    // If it's already a full URL, return as is
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Otherwise, prepend the backend URL
    return `http://localhost:8000${relativeUrl}`;
  };

  // Get hero image with fallbacks
  const getHeroImageStyle = () => {
    if (userProfile?.hero_image_url) {
      const fullImageUrl = getImageUrl(userProfile.hero_image_url);
      return {
        backgroundImage: `url('${fullImageUrl}')`,
        backgroundSize: '1200px 400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else {
      // Fallback to default image
      return {
        backgroundImage: `url('pexels-enginakyurt-1435895.jpg')`,
        backgroundSize: '1200px 400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
  };

  return (
    <div className="add-recipe-page">
      <div className="add-recipe-hero" style={getHeroImageStyle()}>
        <h1>Add New Recipe</h1>
        <p>Create your own delicious recipe</p>
      </div>
      <PillNav />
      <BottomNav />
      <div className="add-recipe-content">
        <div className="recipe-creation-cards">
          {/* Add Recipe from Web Card */}
          <div className="recipe-creation-card web-card">
            <div className="recipe-card-icon-wrapper">
              <div className="recipe-card-icon web-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
            </div>
            <div className="recipe-card-content">
              <h3>Add Recipe from Web</h3>
              <p className="recipe-card-description">
                Paste a recipe URL and we'll extract all the details automatically
              </p>
              <div className="recipe-card-features">
                <div className="recipe-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Automatic extraction</span>
                </div>
                <div className="recipe-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Ingredients & steps</span>
                </div>
              </div>
              <ScrapeWebsiteBtn />
            </div>
          </div>

          {/* Add Own Recipe Card */}
          <div className="recipe-creation-card own-recipe-card">
            <div className="recipe-card-icon-wrapper">
              <div className="recipe-card-icon own-recipe-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
            </div>
            <div className="recipe-card-content">
              <h3>Add Own Recipe</h3>
              <p className="recipe-card-description">
                Create your recipe from scratch with full control over every detail
              </p>
              <div className="recipe-card-features">
                <div className="recipe-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Custom ingredients</span>
                </div>
                <div className="recipe-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Step-by-step guide</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log('Add Recipe Page - Add own recipe button clicked');
                  setNavOrigin('/add-recipe');
                  console.log('Add Recipe Page - origin set to /add-recipe for new recipe');
                  navigate('/recipe/new', { recipe: true });
                }} 
                className="recipe-card-button own-recipe-button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Create Recipe</span>
              </button>
            </div>
          </div>

          {/* My Fridge Card */}
          <div className="recipe-creation-card fridge-card">
            <div className="recipe-card-icon-wrapper">
              <div className="recipe-card-icon fridge-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18l-2 13H5L3 6zM3 6L2.25 3.5"/>
                  <path d="M9 11v6"/>
                  <path d="M15 11v6"/>
                  <path d="M21 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/>
                </svg>
              </div>
            </div>
            <div className="recipe-card-content">
              <h3>My Fridge</h3>
              <p className="recipe-card-description">
                Manage your ingredients and discover recipes based on what you have
              </p>
              <div className="recipe-card-features">
                <div className="recipe-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Ingredient tracking</span>
                </div>
                <div className="recipe-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Recipe suggestions</span>
                </div>
              </div>
              <button 
                onClick={() => setShowFridge(true)}
                className="recipe-card-button fridge-button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18l-2 13H5L3 6zM3 6L2.25 3.5"/>
                  <path d="M9 11v6"/>
                  <path d="M15 11v6"/>
                  <path d="M21 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/>
                </svg>
                <span>Open Fridge</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Conversion Preview Section */}
        <VideoConversionPreview />
      </div>
      
      {/* Fridge Modal */}
      <Fridge 
        isOpen={showFridge} 
        onClose={() => setShowFridge(false)} 
      />
    </div>
  );
};

export default AddRecipePage;
