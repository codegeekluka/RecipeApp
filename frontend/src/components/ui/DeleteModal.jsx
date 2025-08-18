import '../../styles/ui/DeleteModal.css'

export default function DeleteModal({ isOpen, onClose, onDelete }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-exit-button" onClick={onClose} aria-label="Close modal">
          <svg height="20px" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
            <path
              d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
            ></path>
          </svg>
        </button>
        <div className="modal-content">
          <h2 className="modal-heading">Delete recipe?</h2>
          <p className="modal-description">
            Are you sure you want to delete this recipe?
          </p>
        </div>
        <div className="modal-button-wrapper">
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-button primary" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}