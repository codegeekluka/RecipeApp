"""
Integration tests for User Profile API endpoints
"""
import pytest
import tempfile
import os
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.database.db_models import User


class TestUserProfileAPI:
    """Test User Profile API endpoints"""
    
    def test_get_user_profile(self, client: TestClient, sample_user: User):
        """Test getting user profile"""
        response = client.get("/user/profile")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_user.id
        assert data["username"] == sample_user.username
        assert data["email"] == sample_user.email
        assert data["firstname"] == sample_user.firstname
        assert data["lastname"] == sample_user.lastname
        assert data["onboarding_complete"] == sample_user.onboarding_complete
    
    def test_update_user_profile(self, client: TestClient, sample_user: User):
        """Test updating user profile"""
        update_data = {
            "firstname": "Updated First",
            "lastname": "Updated Last",
            "age": 25,
            "profile_picture_url": "https://example.com/new-profile.jpg",
            "hero_image_url": "https://example.com/new-hero.jpg"
        }
        
        response = client.put("/user/profile", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["firstname"] == "Updated First"
        assert data["lastname"] == "Updated Last"
        assert data["age"] == 25
        assert data["profile_picture_url"] == "https://example.com/new-profile.jpg"
        assert data["hero_image_url"] == "https://example.com/new-hero.jpg"
    
    def test_update_user_profile_invalid_age(self, client: TestClient):
        """Test updating user profile with invalid age"""
        update_data = {
            "age": 150  # Invalid age
        }
        
        response = client.put("/user/profile", json=update_data)
        
        assert response.status_code == 400
        assert "Age must be between 0 and 116" in response.json()["detail"]
    
    def test_update_user_profile_negative_age(self, client: TestClient):
        """Test updating user profile with negative age"""
        update_data = {
            "age": -5  # Negative age
        }
        
        response = client.put("/user/profile", json=update_data)
        
        assert response.status_code == 400
        assert "Age must be between 0 and 116" in response.json()["detail"]
    
    def test_complete_onboarding(self, client: TestClient, sample_user: User):
        """Test completing user onboarding"""
        onboarding_data = {
            "firstname": "Onboarded First",
            "lastname": "Onboarded Last",
            "age": 30,
            "how_heard_about": "Social Media",
            "dietary_restrictions": ["vegetarian", "gluten-free"],
            "skill_level": "intermediate",
            "cuisine_preferences": ["italian", "mexican"],
            "health_goals": ["weight_loss", "muscle_gain"],
            "budget_preferences": "medium"
        }
        
        response = client.post("/user/onboarding", json=onboarding_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["firstname"] == "Onboarded First"
        assert data["lastname"] == "Onboarded Last"
        assert data["age"] == 30
        assert data["onboarding_complete"] is True
        assert data["how_heard_about"] == "Social Media"
        assert "vegetarian" in data["dietary_restrictions"]
        assert "gluten-free" in data["dietary_restrictions"]
        assert data["skill_level"] == "intermediate"
        assert "italian" in data["cuisine_preferences"]
        assert "mexican" in data["cuisine_preferences"]
        assert "weight_loss" in data["health_goals"]
        assert "muscle_gain" in data["health_goals"]
        assert data["budget_preferences"] == "medium"
    
    def test_upload_profile_picture(self, client: TestClient):
        """Test uploading profile picture"""
        # Create a temporary image file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(b"fake_image_data")
            temp_path = temp_file.name
        
        try:
            with patch('backend.Apis.user_profile.upload_file_to_s3') as mock_upload:
                mock_upload.return_value = "https://example.com/uploaded-profile.jpg"
                
                with open(temp_path, 'rb') as image_file:
                    response = client.post(
                        "/user/profile-picture",
                        files={"file": ("profile.jpg", image_file, "image/jpeg")}
                    )
                
                assert response.status_code == 200
                data = response.json()
                assert data["profile_picture_url"] == "https://example.com/uploaded-profile.jpg"
        
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_profile_picture_invalid_format(self, client: TestClient):
        """Test uploading profile picture with invalid format"""
        # Create a temporary text file (invalid image format)
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as temp_file:
            temp_file.write(b"not image data")
            temp_path = temp_file.name
        
        try:
            with open(temp_path, 'rb') as text_file:
                response = client.post(
                    "/user/profile-picture",
                    files={"file": ("profile.txt", text_file, "text/plain")}
                )
            
            assert response.status_code == 400
            assert "File must be an image" in response.json()["detail"]
        
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_hero_image(self, client: TestClient):
        """Test uploading hero image"""
        # Create a temporary image file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(b"fake_hero_image_data")
            temp_path = temp_file.name
        
        try:
            with patch('backend.Apis.user_profile.upload_file_to_s3') as mock_upload:
                mock_upload.return_value = "https://example.com/uploaded-hero.jpg"
                
                with open(temp_path, 'rb') as image_file:
                    response = client.post(
                        "/user/hero-image",
                        files={"file": ("hero.jpg", image_file, "image/jpeg")}
                    )
                
                assert response.status_code == 200
                data = response.json()
                assert data["hero_image_url"] == "https://example.com/uploaded-hero.jpg"
        
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_hero_image_invalid_format(self, client: TestClient):
        """Test uploading hero image with invalid format"""
        # Create a temporary text file (invalid image format)
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as temp_file:
            temp_file.write(b"not image data")
            temp_path = temp_file.name
        
        try:
            with open(temp_path, 'rb') as text_file:
                response = client.post(
                    "/user/hero-image",
                    files={"file": ("hero.txt", text_file, "text/plain")}
                )
            
            assert response.status_code == 400
            assert "File must be an image" in response.json()["detail"]
        
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_delete_profile_picture(self, client: TestClient, sample_user: User):
        """Test deleting profile picture"""
        # First set a profile picture URL
        sample_user.profile_picture_url = "/uploads/profile_pictures/test.jpg"
        client.app.dependency_overrides[get_db].__next__().commit()
        
        response = client.delete("/user/delete-profile-picture")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Profile picture deleted successfully"
        
        # Verify the profile picture URL is set to None
        client.app.dependency_overrides[get_db].__next__().refresh(sample_user)
        assert sample_user.profile_picture_url is None
    
    def test_delete_hero_image(self, client: TestClient, sample_user: User):
        """Test deleting hero image"""
        # First set a hero image URL
        sample_user.hero_image_url = "/uploads/hero_images/test.jpg"
        client.app.dependency_overrides[get_db].__next__().commit()
        
        response = client.delete("/user/delete-hero-image")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Hero image deleted successfully"
        
        # Verify the hero image URL is set to None
        client.app.dependency_overrides[get_db].__next__().refresh(sample_user)
        assert sample_user.hero_image_url is None
    
    def test_get_user_preferences(self, client: TestClient, sample_user: User):
        """Test getting user preferences"""
        response = client.get("/user/preferences")
        
        assert response.status_code == 200
        data = response.json()
        assert "dietary_restrictions" in data
        assert "skill_level" in data
        assert "cuisine_preferences" in data
        assert "health_goals" in data
        assert "budget_preferences" in data
    
    def test_update_user_preferences(self, client: TestClient):
        """Test updating user preferences"""
        preferences_data = {
            "dietary_restrictions": ["vegan", "nut_free"],
            "skill_level": "advanced",
            "cuisine_preferences": ["japanese", "thai"],
            "health_goals": ["maintenance"],
            "budget_preferences": "high"
        }
        
        response = client.put("/user/preferences", json=preferences_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "vegan" in data["dietary_restrictions"]
        assert "nut_free" in data["dietary_restrictions"]
        assert data["skill_level"] == "advanced"
        assert "japanese" in data["cuisine_preferences"]
        assert "thai" in data["cuisine_preferences"]
        assert "maintenance" in data["health_goals"]
        assert data["budget_preferences"] == "high"
    
    def test_get_user_stats(self, client: TestClient, sample_user: User):
        """Test getting user statistics"""
        response = client.get("/user/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_recipes" in data
        assert "favorite_recipes" in data
        assert "active_recipes" in data
        assert "total_sessions" in data
        assert "total_conversations" in data
        assert isinstance(data["total_recipes"], int)
        assert isinstance(data["favorite_recipes"], int)
        assert isinstance(data["active_recipes"], int)
        assert isinstance(data["total_sessions"], int)
        assert isinstance(data["total_conversations"], int)
    
    def test_delete_user_account(self, client: TestClient, sample_user: User):
        """Test deleting user account"""
        response = client.delete("/user/account")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Account deleted successfully"
    
    def test_change_password(self, client: TestClient):
        """Test changing user password"""
        password_data = {
            "current_password": "oldpassword",
            "new_password": "newpassword123"
        }
        
        response = client.put("/user/change-password", json=password_data)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"
    
    def test_change_password_invalid_current(self, client: TestClient):
        """Test changing password with invalid current password"""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
        
        response = client.put("/user/change-password", json=password_data)
        
        assert response.status_code == 400
        assert "Current password is incorrect" in response.json()["detail"]
    
    def test_change_password_weak_new_password(self, client: TestClient):
        """Test changing password with weak new password"""
        password_data = {
            "current_password": "oldpassword",
            "new_password": "123"  # Too short
        }
        
        response = client.put("/user/change-password", json=password_data)
        
        assert response.status_code == 400
        assert "Password must be at least 8 characters" in response.json()["detail"]
