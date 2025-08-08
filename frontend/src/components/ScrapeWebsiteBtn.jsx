import { useState } from 'react'
import '../styles/ScrapeButton.css'
import { useNavigate } from 'react-router-dom'

const ScrapeWebsiteBtn = () => {
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState('') 
    const [error, setError] = useState('')

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
          
        console.log("Entered URL:", inputValue);
        handleClose()
        try{
            const token = localStorage.getItem('token');
             //need to send request to our FastAPI backend, running on port 8000
            const response = await fetch('http://localhost:8000/RecipePage', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ url: inputValue }),
           });

            if (!response.ok) {
              const error = await response.json();
              if (response.status === 401 || response.status === 403){
                localStorage.removeItem('token')
                console.error("Failed to extract recipe: ",error.detail);
                navigate('/')
            } else {
            console.error("Failed to extract recipe: ", error.detail);
            alert(`Error: ${error.detail || "Failed to scrape recipe."}`);
            }
            return;
          }

          const data = await response.json();
          const recipeSlug = data.slug
        
          //redirect to new page
          navigate(`/recipe/${recipeSlug}`)
        } catch (err) {
            console.error("Request failed: ", err)
            alert("Network error. Please try again later.")
        }
    
      }
    
      const handleButtonClick = () => {
        setShowModal(true);
        setError('');
        setInputValue('');
      };
      const handleClose = () => {
        setShowModal(false);
        setError('');
        setInputValue('');
      };
    


    return(
        <div className="enter-recipe">
            <button className="scrape-btn" onClick={handleButtonClick}>+</button>
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
                    />
                    <p className="error" style={{ visibility: error ? "visible" : "hidden", color: "red" }}>
                        {error||"placeholder"}
                    </p>
                    <div className="modal-actions">
                        <button className="submit-btn" onClick={scrapeWebsite}>Submit</button>
                        <button className="cancel-btn" onClick={handleClose}>Cancel</button>
                    </div>
                </div>
                </>
            )}
        </div>
    )
}

export default ScrapeWebsiteBtn