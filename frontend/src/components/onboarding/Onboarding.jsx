import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PreferencesStep from './PreferencesStep';
import '../../styles/onboarding/Onboarding.css';
import '../../styles/onboarding/shared.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Profile data
    firstname: '',
    lastname: '',
    bio: '',
    profile_picture_url: '',
    hero_image_url: '',
    age: '',
    
    // Preferences data
    dietary_restrictions: [],
    cooking_skill_level: '',
    favorite_cuisines: [],
    cooking_goals: [],
    time_availability: '',
    household_size: '',
    preferences_step: 1,
    
    // How heard about data
    how_heard_about: '',
    how_heard_about_other: ''
  });

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const skipOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:8000/users/me/onboarding-complete', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect to home page
      navigate('/home');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Submit onboarding data to backend
      await axios.patch('http://localhost:8000/users/me/onboarding-complete', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Onboarding completed successfully:', formData);
      
      // Redirect to home page
      navigate('/home');
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <PreferencesStep
        formData={formData}
        updateFormData={updateFormData}
        onPrev={() => {}} // No-op since we're already at the start
        onSkip={skipOnboarding}
        onComplete={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default Onboarding;
