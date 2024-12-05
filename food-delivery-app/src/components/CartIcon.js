// src/components/CartIcon.js
import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useParams, useNavigate } from 'react-router-dom';
import './CartIcon.css'; // We'll add some simple styles below

function CartIcon() {
  const { cartItems } = useCart();
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0); // Get total item count

  const handleCartClick = () => {
    navigate('/checkout', { state: { restaurantId } });
  };

  return (
    <div className="cart-icon" onClick={handleCartClick}>
      <span className="cart-icon-count">{itemCount}</span>
      🛒 {/* You can replace this with any cart icon you prefer */}
    </div>
  );
}

export default CartIcon;
