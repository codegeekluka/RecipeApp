import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Planner.css';
import PillNav from '../components/layout/PillNav.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import RecipeSelectionModal from '../components/planner/RecipeSelectionModal.jsx';
import RecipeCard from '../components/pages/RecipeCard.jsx';

const Planner = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'dinner' or 'lunch'
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'week'
  const [mealPlan, setMealPlan] = useState({}); // Store planned meals
  const [gliderStyle, setGliderStyle] = useState({});
  const todayRef = useRef(null);
  const weekRef = useRef(null);

  // Load meal plan from localStorage on component mount
  useEffect(() => {
    const savedMealPlan = localStorage.getItem('mealPlan');
    if (savedMealPlan) {
      try {
        const parsedMealPlan = JSON.parse(savedMealPlan);
        // Clean up old meal plans (older than 7 days)
        const cleanedMealPlan = cleanOldMealPlans(parsedMealPlan);
        setMealPlan(cleanedMealPlan);
      } catch (error) {
        console.error('Error loading meal plan from localStorage:', error);
      }
    }
  }, []);

  // Update glider position when activeTab changes
  useEffect(() => {
    const updateGlider = () => {
      let activeButton = null;
      let position = 0;

      if (activeTab === 'today' && todayRef.current) {
        activeButton = todayRef.current;
        position = 0;
      } else if (activeTab === 'week' && weekRef.current) {
        activeButton = weekRef.current;
        position = todayRef.current ? todayRef.current.offsetWidth + 4 : 0;
      }

      if (activeButton) {
        setGliderStyle({
          transform: `translateX(${position}px)`,
          width: `${activeButton.offsetWidth}px`,
          height: `${activeButton.offsetHeight}px`,
        });
      }
    };

    // Add a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateGlider, 10);
    window.addEventListener('resize', updateGlider);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateGlider);
    };
  }, [activeTab]);

  // Function to clean up meal plans older than 7 days
  const cleanOldMealPlans = (mealPlanData) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const cleanedPlan = {};
    Object.keys(mealPlanData).forEach(dateString => {
      const planDate = new Date(dateString);
      if (planDate >= sevenDaysAgo) {
        cleanedPlan[dateString] = mealPlanData[dateString];
      }
    });
    
    // Update localStorage if we cleaned anything
    if (Object.keys(cleanedPlan).length !== Object.keys(mealPlanData).length) {
      localStorage.setItem('mealPlan', JSON.stringify(cleanedPlan));
    }
    
    return cleanedPlan;
  };

  // Save meal plan to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(mealPlan).length > 0) {
      localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    }
  }, [mealPlan]);

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

  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
  };

  const handleCreateMealPlan = (newMealPlanData, mealType) => {
    // Create a new meal plan entry
    const newMealPlan = { ...mealPlan };
    
    // First, clear all existing assignments for this meal type across all days
    Object.keys(newMealPlan).forEach(dateString => {
      if (newMealPlan[dateString]) {
        newMealPlan[dateString][mealType] = null;
      }
    });
    
    // Then, set the new assignments
    Object.entries(newMealPlanData).forEach(([dateString, dayPlan]) => {
      if (!newMealPlan[dateString]) {
        newMealPlan[dateString] = { lunch: null, dinner: null };
      }
      
      // Set the recipe for the specified meal type
      newMealPlan[dateString][mealType] = dayPlan[mealType];
    });
    
    setMealPlan(newMealPlan);
    
    // Save to localStorage
    localStorage.setItem('mealPlan', JSON.stringify(newMealPlan));
    
    console.log('Meal plan updated:', newMealPlan);
  };

  const handleClearMealPlan = () => {
    if (window.confirm('Are you sure you want to clear your entire meal plan?')) {
      setMealPlan({});
      localStorage.removeItem('mealPlan');
    }
  };

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
        dateString: date.toISOString().split('T')[0] // YYYY-MM-DD format
      });
    }
    return days;
  };
  
  const next7Days = getNext7Days();
  const todayName = next7Days[0].name; // Today is the first day

  return (
    <div className="planner-page">
      <div className="planner-hero" style={getHeroImageStyle()}>
        <h1>Meal Planning</h1>
        <p>Organize your weekly menu</p>
      </div>
      <PillNav />
      <BottomNav />
      <div className="planner-content">
        {/* Weekly Plan Overview */}
        <div className="weekly-overview">
          {/* Top Navigation Bar */}
          <div className="top-nav-bar">
            {/* Tab Navigation */}
            <div className="overview-tabs">
              <button 
                ref={todayRef}
                className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
                onClick={() => setActiveTab('today')}
              >
                Today
              </button>
              <button 
                ref={weekRef}
                className={`tab-button ${activeTab === 'week' ? 'active' : ''}`}
                onClick={() => setActiveTab('week')}
              >
                This Week
              </button>
              <span 
                className="glider" 
                style={gliderStyle}
              ></span>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="action-button plan-button"
                onClick={() => handleOpenModal('dinner')}
                title="Plan Your Dinner"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span>Plan Dinner</span>
              </button>
              <button 
                className="action-button plan-button"
                onClick={() => handleOpenModal('lunch')}
                title="Plan Your Lunch"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span>Plan Lunch</span>
              </button>
              {Object.keys(mealPlan).length > 0 && (
                <button 
                  className="action-button clear-button"
                  onClick={handleClearMealPlan}
                  title="Clear Meal Plan"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'today' ? (
            <div className="today-view">
              <div className="today-header">
                <h3>Today's Meals</h3>
              </div>
              <div className="today-meals">
                <div className="meal-slot lunch-slot">
                  <span className="meal-label">Lunch</span>
                  {mealPlan[next7Days[0].dateString]?.lunch ? (
                    <div className="today-recipe-card">
                      <RecipeCard 
                        recipe={mealPlan[next7Days[0].dateString].lunch}
                        onClick={() => navigate(`/recipe/${mealPlan[next7Days[0].dateString].lunch.slug}`)}
                      />
                    </div>
                  ) : (
                    <div className="meal-placeholder" onClick={() => handleOpenModal('lunch')}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="meal-slot dinner-slot">
                  <span className="meal-label">Dinner</span>
                  {mealPlan[next7Days[0].dateString]?.dinner ? (
                    <div className="today-recipe-card">
                      <RecipeCard 
                        recipe={mealPlan[next7Days[0].dateString].dinner}
                        onClick={() => navigate(`/recipe/${mealPlan[next7Days[0].dateString].dinner.slug}`)}
                      />
                    </div>
                  ) : (
                    <div className="meal-placeholder" onClick={() => handleOpenModal('dinner')}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="week-view">
              <div className="week-grid">
                {next7Days.map((day, index) => (
                  <div key={day.dateString} className={`day-slot ${index === 0 ? 'today' : ''}`}>
                    <h3 className="day-name">
                      {day.name}
                      {index === 0 && <span className="today-indicator">Today</span>}
                    </h3>
                    <div className="meal-slots">
                      <div className="meal-slot lunch-slot">
                        <span className="meal-label">Lunch</span>
                        {mealPlan[day.dateString]?.lunch ? (
                          <div className="planned-meal">
                            <img 
                              src={mealPlan[day.dateString].lunch.image || '/pexels-valeriya-842571.jpg'} 
                              alt={mealPlan[day.dateString].lunch.title}
                              className="meal-image"
                            />
                            <span className="meal-title">{mealPlan[day.dateString].lunch.title}</span>
                          </div>
                        ) : (
                          <div className="meal-placeholder" onClick={() => handleOpenModal('lunch')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="16"/>
                              <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="meal-slot dinner-slot">
                        <span className="meal-label">Dinner</span>
                        {mealPlan[day.dateString]?.dinner ? (
                          <div className="planned-meal">
                            <img 
                              src={mealPlan[day.dateString].dinner.image || '/pexels-valeriya-842571.jpg'} 
                              alt={mealPlan[day.dateString].dinner.title}
                              className="meal-image"
                            />
                            <span className="meal-title">{mealPlan[day.dateString].dinner.title}</span>
                          </div>
                        ) : (
                          <div className="meal-placeholder" onClick={() => handleOpenModal('dinner')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="16"/>
                              <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Recipe Selection Modal */}
      {showModal && (
        <RecipeSelectionModal
          isOpen={showModal}
          onClose={handleCloseModal}
          mealType={modalType}
          onCreatePlan={handleCreateMealPlan}
          currentMealPlan={mealPlan}
        />
      )}
    </div>
  );
};

export default Planner;
