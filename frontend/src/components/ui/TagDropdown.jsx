import React, { useState, useRef, useEffect } from "react";
import "../../styles/ui/TagDropdown.css";

export default function TagDropdown({ options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="tag-dropdown" ref={dropdownRef}>
      <button
        className="tag-dropdown-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selected || "All tags"}
        <span className="arrow">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <ul className="tag-dropdown-menu">
          <li onClick={() => { onChange(""); setIsOpen(false); }}>All tags</li>
          {options.map((tag) => (
            <li
              key={tag}
              onClick={() => {
                onChange(tag);
                setIsOpen(false);
              }}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
