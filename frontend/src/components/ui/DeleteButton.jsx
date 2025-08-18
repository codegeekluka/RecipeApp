import '../../styles/ui/DeleteButton.css'
import { useState } from 'react'
import { useNavigate, useParams} from 'react-router-dom';
import DeleteModal from './DeleteModal';
import axios from "axios"


const DeleteButton = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate= useNavigate()
  const { slug } = useParams();

  const handleDeleteClick = () => {
    setModalOpen(true);
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/recipes/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Optional: redirect or update state/UI
      alert("Recipe deleted successfully");
      navigate('/home')
    } catch (err) {
      if (err.response) {
        // Server responded with a status outside 2xx
        alert(`Delete failed: ${err.response.status} - ${err.response.data.detail || err.response.statusText}`);
        console.error("Delete failed response:", err.response);
      } else if (err.request) {
        // Request made but no response received (likely CORS or network error)
        alert("Delete failed: No response from server (CORS or network error)");
        console.error("Delete failed request:", err.request);
      } else {
        // Something else happened
        alert(`Delete failed: ${err.message}`);
        console.error("Delete error:", err.message);
      }
    }
  };
  
  return(
    <>
      <button onClick={handleDeleteClick} className="delete-button">
        <svg viewBox="0 0 448 512" className="svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
      </button>
      <DeleteModal
      isOpen={modalOpen}
      onClose={handleCancel}
      onDelete={handleDeleteConfirm}
      />
    </>
    )
}
export default DeleteButton