import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/fridge/Fridge.css';

const Fridge = ({ isOpen, onClose }) => {
  const [fridgeItems, setFridgeItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'fruits', quantity: 1, unit: 'pcs' });

  // Load fridge items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('fridgeItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        setFridgeItems(parsedItems);
      } catch (error) {
        console.error('Error loading fridge items:', error);
      }
    }
  }, []);

  // Save fridge items to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('fridgeItems', JSON.stringify(fridgeItems));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('fridgeUpdated'));
  }, [fridgeItems]);

  const categories = [
    { id: 'all', name: 'All Items', icon: '📦' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'vegetables', name: 'Vegetables', icon: '🥕' },
    { id: 'dairy', name: 'Dairy', icon: '🥛' },
    { id: 'meat', name: 'Meat & Seafood', icon: '🥩' },
    { id: 'grains', name: 'Grains & Pasta', icon: '🍞' },
    { id: 'spices', name: 'Spices & Herbs', icon: '🌿' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' },
    { id: 'other', name: 'Other', icon: '📦' }
  ];

  const units = ['pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'cups', 'tbsp', 'tsp'];

  const filteredItems = fridgeItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesCategory;
  });

  const addItem = () => {
    if (newItem.name.trim()) {
      const item = {
        id: Date.now(),
        ...newItem,
        name: newItem.name.trim(),
        addedDate: new Date().toISOString()
      };
      setFridgeItems(prev => [...prev, item]);
      setNewItem({ name: '', category: 'fruits', quantity: 1, unit: 'pcs' });
      setShowAddForm(false);
    }
  };

  const updateQuantity = (id, change) => {
    setFridgeItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity === 0) {
          return null; // Will be filtered out
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id) => {
    setFridgeItems(prev => prev.filter(item => item.id !== id));
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(cat => cat.id === category);
    return categoryObj ? categoryObj.icon : '📦';
  };

  const getCategoryName = (category) => {
    const categoryObj = categories.find(cat => cat.id === category);
    return categoryObj ? categoryObj.name : 'Other';
  };

  const getEmptyMessage = () => {
    if (selectedCategory === 'all') {
      return {
        title: 'Your fridge is empty',
        message: 'Add some items to get started!'
      };
    }
    
    const categoryObj = categories.find(cat => cat.id === selectedCategory);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : 'items';
    
    return {
      title: `You don't have any ${categoryName} in your fridge`,
      message: `Add some ${categoryName} to get started!`
    };
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fridge-overlay">
      <div className="fridge-container">
        {/* Header */}
        <div className="fridge-header">
          <div className="fridge-title">
            <span className="fridge-icon">🧊</span>
            <h2>My Fridge</h2>
          </div>
          <button className="fridge-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Add Button */}
        <div className="fridge-controls">
          <button 
            className="fridge-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Item
          </button>
        </div>

        {/* Categories */}
        <div className="fridge-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`fridge-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>


        {/* Items Grid */}
        <div className="fridge-items">
          {filteredItems.length === 0 ? (
            <div className="fridge-empty">
              <div className="empty-icon">🧊</div>
              <h3>{getEmptyMessage().title}</h3>
              <p>{getEmptyMessage().message}</p>
            </div>
          ) : (
            <div className="fridge-grid">
              {filteredItems.map(item => (
                <div key={item.id} className="fridge-item">
                  <div className="item-header">
                    <div className="item-info">
                      <span className="item-icon">{getCategoryIcon(item.category)}</span>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <p className="item-category">{getCategoryName(item.category)}</p>
                      </div>
                    </div>
                    <button 
                      className="remove-item-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="item-quantity">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, -0.5)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                      <div className="quantity-input-container">
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string for editing
                            if (value === '') {
                              setFridgeItems(prev => prev.map(i => 
                                i.id === item.id ? { ...i, quantity: '' } : i
                              ));
                              return;
                            }
                            
                            const newQuantity = parseFloat(value);
                            if (!isNaN(newQuantity) && newQuantity >= 0) {
                              if (newQuantity === 0) {
                                removeItem(item.id);
                              } else {
                                setFridgeItems(prev => prev.map(i => 
                                  i.id === item.id ? { ...i, quantity: newQuantity } : i
                                ));
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // If empty on blur, set to 1
                            if (e.target.value === '') {
                              setFridgeItems(prev => prev.map(i => 
                                i.id === item.id ? { ...i, quantity: 1 } : i
                              ));
                            }
                          }}
                          className="quantity-input"
                        />
                        <span className="quantity-unit">{item.unit}</span>
                      </div>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, 0.5)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddForm && (
        <div className="add-item-overlay">
          <div className="add-item-modal">
            <div className="add-form-header">
              <h3>Add New Item</h3>
              <button 
                className="close-form-btn"
                onClick={() => setShowAddForm(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form className="add-form-content" onSubmit={(e) => { e.preventDefault(); addItem(); }}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Apples, Milk, Bread"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="form-select"
                  >
                    {categories.slice(1).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="form-select"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="add-item-btn">
                  Add to Fridge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default Fridge;
