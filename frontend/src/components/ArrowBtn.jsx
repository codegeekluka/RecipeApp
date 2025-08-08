
const ArrowButton = ({ direction, onClick }) => {
     // Define points for left and right arrows
    const points = direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6";
    return(
        <button
        onClick={onClick}
        style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
        aria-label="Previous"
        >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            style={{ display: "block" }}
        >
            <polyline points={points} />
        </svg>
        </button>
    )
}
  
  export default ArrowButton;
  