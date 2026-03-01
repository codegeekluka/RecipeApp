import { useState, useContext } from 'react'
import '../../styles/ui/ScrapeButton.css'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'

const ScrapeWebsiteBtn = () => {
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState('') 
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { setNavOrigin } = useContext(AuthContext)

    const navigate = useNavigate()
    
    const isValidUrl = (string) => {
        try {
          const url = new URL(string);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
          return false;
        }
      };
      

    const scrapeWebsite = async () =>{
        if (!isValidUrl(inputValue.trim())) {
            setError("Please enter a valid URL");
            return;
        }
          
        console.log("ScrapeWebsiteBtn - Starting scrape for URL:", inputValue);
        setIsLoading(true);
        setError('');
        
        try{
            const token = localStorage.getItem('token');
            console.log("ScrapeWebsiteBtn - token exists:", !!token);
            
            if (!token) {
                setError("Please log in to scrape recipes");
                setIsLoading(false);
                return;
            }
            
            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
            
            console.log("ScrapeWebsiteBtn - making request to backend");
            const response = await fetch('http://localhost:8000/RecipePage', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ url: inputValue }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log("ScrapeWebsiteBtn - response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.log("ScrapeWebsiteBtn - error response:", errorData);
                
                if (response.status === 401 || response.status === 403){
                    console.log("ScrapeWebsiteBtn - authentication error, clearing token");
                    setError("Session expired. Please log in again.");
                    localStorage.removeItem('token');
                    // Don't navigate immediately, let user see the error first
                } else {
                    setError(errorData.detail || "Failed to scrape recipe. Please try again.");
                }
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            console.log("ScrapeWebsiteBtn - success response:", data);
            const recipeSlug = data.slug
            
            // Close modal and redirect to new page
            console.log("ScrapeWebsiteBtn - redirecting to recipe:", recipeSlug);
            handleClose();
            setNavOrigin('/add-recipe'); // Updated to match new origin
            navigate(`/recipe/${recipeSlug}`);
            
        } catch (err) {
            console.error("ScrapeWebsiteBtn - Request failed: ", err);
            if (err.name === 'AbortError') {
                setError("Request timed out. The website took too long to respond. Please try again.");
            } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError("Network error. Please check your connection and try again.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleButtonClick = () => {
        setShowModal(true);
        setError('');
        setInputValue('');
        setIsLoading(false);
    };
    
    const handleClose = () => {
        setShowModal(false);
        setError('');
        setInputValue('');
        setIsLoading(false);
    };

    return(
        <div className="enter-recipe">
            <button className="recipe-card-button web-button" onClick={handleButtonClick}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span>Add from Web</span>
            </button>
            {/* Modal */}
            {showModal && (
                <>
                <div className="modal-backdrop" onClick={handleClose} />
                <div className="modal">
                    <h3>Enter a URL</h3>
                    <input
                        type="text"
                        placeholder="https://example.com"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            setError('')
                        }}
                        disabled={isLoading}
                    />
                    <p className="error" style={{ visibility: error ? "visible" : "hidden", color: "red" }}>
                        {error||"placeholder"}
                    </p>
                    {isLoading && (
                        <div className="loading-indicator">
                            <p>Scraping recipe... This may take a few moments.</p>
                            <div className="spinner"></div>
                        </div>
                    )}
                    <div className="modal-actions">
                        <button 
                            className="submit-btn" 
                            onClick={scrapeWebsite}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Scraping...' : 'Submit'}
                        </button>
                        <button 
                            className="cancel-btn" 
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
                </>
            )}
        </div>
    )
}

export default ScrapeWebsiteBtn