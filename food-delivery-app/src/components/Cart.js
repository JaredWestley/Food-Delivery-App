// src/components/Cart.js
import React from 'react';
import { useCart } from '../contexts/CartContext';

function Cart() {
  const { cartItems } = useCart();

  return (
    <div className="cart">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        cartItems.map((item, index) => (
          <div key={index} className="cart-item">
            <h4>{item.name}</h4>
            <p>Quantity: {item.quantity}</p>
            <p>Total: ${item.price * item.quantity}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Cart;
