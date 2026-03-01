import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ProfileSection from './ProfileSection';
import ReviewSection from './ReviewSection';
import '../../styles/onboarding/shared.css';
import '../../styles/onboarding/PreferencesStep.css';

const PreferencesStep = ({ formData, updateFormData, onPrev, onSkip, onComplete, loading }) => {
  const [currentStep, setCurrentStep] = useState(formData.preferences_step || 1);
  const [preferenceOptions, setPreferenceOptions] = useState({
    dietary_restrictions: [],
    cuisines: [],
    health_goals: [],
    budget_options: [],
    skill_levels: [],
    time_options: []
  });

  const token = localStorage.getItem('token');

  const fetchPreferenceOptions = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/me/preferences/options', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Preference options fetched:', response.data);
      
      // Add fallback time options if not provided by API
      const options = {
        ...response.data,
        time_options: response.data.time_options || [
          'quick_meals',
          'weekend_cooking',
          'meal_prep',
          'special_occasions',
          'daily_cooking'
        ]
      };
      
      console.log('Final preference options:', options);
      setPreferenceOptions(options);
    } catch (error) {
      console.error('Error fetching preference options:', error);
      
      // Set fallback options on error
      const fallbackOptions = {
        dietary_restrictions: [],
        cuisines: [],
        health_goals: [],
        budget_options: [],
        skill_levels: [],
        time_options: [
          'quick_meals',
          'weekend_cooking',
          'meal_prep',
          'special_occasions',
          'daily_cooking'
        ]
      };
      setPreferenceOptions(fallbackOptions);
    }
  }, [token]);

  useEffect(() => {
    fetchPreferenceOptions();
  }, [fetchPreferenceOptions]);

  const handleCheckboxChange = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    updateFormData({ [field]: newValues });
  };

  const handleRadioChange = (field, value) => {
    // If the same value is clicked again, deselect it
    if (formData[field] === value) {
      updateFormData({ [field]: null });
    } else {
      updateFormData({ [field]: value });
    }
  };

  const formatLabel = (label) => {
    return label.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const nextStep = () => {
    if (currentStep < 5) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateFormData({ preferences_step: newStep });
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateFormData({ preferences_step: newStep });
    } else {
      onPrev();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Tell us about yourself";
      case 2: return "Let's personalize your recipes";
      case 3: return "Let's personalize your recipes";
      case 4: return "Let's personalize your recipes";
      case 5: return "How did you discover Cheffy?";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "Create your profile to get started";
      case 2: return "Tell us about your cooking experience and favorite cuisines";
      case 3: return "Share your dietary needs and health goals";
      case 4: return "Help us understand your budget and time constraints";
      case 5: return "Help us understand how users find our app";
      default: return "";
    }
  };

  const isStepValid = () => {
    if (currentStep === 5) {
      // Make validation optional - allow completion even without selection
      const hasSelection = formData.how_heard_about && formData.how_heard_about.trim() !== '';
      const isValidForOther = !formData.how_heard_about || formData.how_heard_about !== 'Other' || formData.how_heard_about_other?.trim();
      
      console.log('Step 5 validation:', {
        how_heard_about: formData.how_heard_about,
        how_heard_about_other: formData.how_heard_about_other,
        hasSelection: hasSelection,
        isValidForOther: isValidForOther,
        isValid: isValidForOther // Only validate "Other" field if "Other" is selected
      });
      return isValidForOther; // Allow completion even without selection
    }
    return true;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Profile Step
        return <ProfileSection formData={formData} updateFormData={updateFormData} />;

      case 2: // Cooking Basics
        return (
          <>
            {/* Cooking Skill Level */}
            <div className="form-group">
              <label className="form-group__label">Cooking Skill Level</label>
              <div className="radio-group">
                {preferenceOptions.skill_levels?.map((level) => (
                  <div
                    key={level}
                    className={`radio-item ${formData.skill_level === level ? 'radio-item--selected' : ''}`}
                    onClick={() => handleRadioChange('skill_level', level)}
                  >
                    <input
                      type="radio"
                      name="skill_level"
                      value={level}
                      checked={formData.skill_level === level}
                      onChange={() => handleRadioChange('skill_level', level)}
                      className="radio-item__input"
                    />
                    <span className="radio-item__label">{formatLabel(level)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Cuisines */}
            <div className="form-group">
              <label className="form-group__label">Preferred Cuisines</label>
              <div className="checkbox-group">
                {preferenceOptions.cuisines?.map((cuisine) => (
                  <div
                    key={cuisine}
                    className={`checkbox-item ${formData.cuisine_preferences?.includes(cuisine) ? 'checkbox-item--selected' : ''}`}
                    onClick={() => handleCheckboxChange('cuisine_preferences', cuisine)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cuisine_preferences?.includes(cuisine) || false}
                      onChange={() => handleCheckboxChange('cuisine_preferences', cuisine)}
                      className="checkbox-item__input"
                    />
                    <span className="checkbox-item__label">{formatLabel(cuisine)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 3: // Diet & Health
        return (
          <>
            {/* Dietary Restrictions */}
            <div className="form-group">
              <label className="form-group__label">Dietary Restrictions</label>
              <div className="checkbox-group">
                {preferenceOptions.dietary_restrictions?.map((restriction) => (
                  <div
                    key={restriction}
                    className={`checkbox-item ${formData.dietary_restrictions?.includes(restriction) ? 'checkbox-item--selected' : ''}`}
                    onClick={() => handleCheckboxChange('dietary_restrictions', restriction)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.dietary_restrictions?.includes(restriction) || false}
                      onChange={() => handleCheckboxChange('dietary_restrictions', restriction)}
                      className="checkbox-item__input"
                    />
                    <span className="checkbox-item__label">{formatLabel(restriction)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Goals */}
            <div className="form-group">
              <label className="form-group__label">Health Goals</label>
              <div className="checkbox-group">
                {preferenceOptions.health_goals?.map((goal) => (
                  <div
                    key={goal}
                    className={`checkbox-item ${formData.health_goals?.includes(goal) ? 'checkbox-item--selected' : ''}`}
                    onClick={() => handleCheckboxChange('health_goals', goal)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.health_goals?.includes(goal) || false}
                      onChange={() => handleCheckboxChange('health_goals', goal)}
                      className="checkbox-item__input"
                    />
                    <span className="checkbox-item__label">{formatLabel(goal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 4: // Budget & Time
        return (
          <>
            {/* Budget Preferences */}
            <div className="form-group">
              <label className="form-group__label">Budget Preferences</label>
              <div className="checkbox-group">
                {preferenceOptions.budget_options?.map((option) => (
                  <div
                    key={option}
                    className={`checkbox-item ${formData.budget_preferences?.includes(option) ? 'checkbox-item--selected' : ''}`}
                    onClick={() => handleCheckboxChange('budget_preferences', option)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.budget_preferences?.includes(option) || false}
                      onChange={() => handleCheckboxChange('budget_preferences', option)}
                      className="checkbox-item__input"
                    />
                    <span className="checkbox-item__label">{formatLabel(option)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Preferences */}
            <div className="form-group">
              <label className="form-group__label">Time Availability</label>
              <div className="radio-group">
                {preferenceOptions.time_options?.map((option) => (
                  <div
                    key={option}
                    className={`radio-item ${formData.time_availability === option ? 'radio-item--selected' : ''}`}
                    onClick={() => handleRadioChange('time_availability', option)}
                  >
                    <input
                      type="radio"
                      name="time_availability"
                      value={option}
                      checked={formData.time_availability === option}
                      onChange={() => handleRadioChange('time_availability', option)}
                      className="radio-item__input"
                    />
                    <span className="radio-item__label">{formatLabel(option)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 5: // Review Step
        return <ReviewSection formData={formData} updateFormData={updateFormData} />;

      default:
        return null;
    }
  };

  return (
            <div className="modal onboarding-modal">
      <div className="modal__content">
        {currentStep !== 1 && (
          <div className="modal__header">
            <h2 className="modal__title">{getStepTitle()}</h2>
            <p className="modal__subtitle">{getStepSubtitle()}</p>
          </div>
        )}

        <div className="modal__body">
          {renderStepContent()}
        </div>

        {/* Progress Indicator - Show all 5 steps */}
        <div className="progress">
          <div className="progress__pills">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`progress__pill ${currentStep === step ? 'progress__pill--active' : ''} ${currentStep > step ? 'progress__pill--completed' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="modal__footer modal__footer--two-buttons">
          {currentStep === 1 ? (
            <>
              <button className="btn btn--skip" onClick={onSkip} disabled={loading}>
                Skip for now
              </button>
              <button className="btn btn--primary" onClick={nextStep} disabled={loading}>
                Next
              </button>
            </>
          ) : currentStep === 5 ? (
            <>
              <button className="btn btn--secondary" onClick={prevStep} disabled={loading}>
                Back
              </button>
              <button 
                className="btn btn--primary" 
                onClick={() => {
                  console.log('Complete Setup button clicked');
                  console.log('Current formData:', formData);
                  console.log('Loading state:', loading);
                  console.log('Validation result:', isStepValid());
                  onComplete();
                }} 
                disabled={loading || !isStepValid()}
              >
                Complete Setup
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--secondary" onClick={prevStep} disabled={loading}>
                Back
              </button>
              <button className="btn btn--primary" onClick={nextStep} disabled={loading}>
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesStep;

