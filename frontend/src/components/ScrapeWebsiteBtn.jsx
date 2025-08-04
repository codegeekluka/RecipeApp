import { useState } from 'react'
import '../styles/ScrapeButton.css'

const ScrapeWebsiteBtn = () => {
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState('') 
    const [error, setError] = useState('')
    
    const scrapeWebsite = async () =>{
        const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-./?%&=]*)?$/;
        if (!urlPattern.test(inputValue.trim())) {
            setError("Please enter a valid URL");
            return;
        }
        console.log("Entered URL:", inputValue);
        handleClose()
        //need to send request to our FastAPI backend, running on port 8000
        const response = await fetch('http://localhost:8000/RecipePage', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: inputValue }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log(data)
        } else {
          console.error("Failed to extract recipe");
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