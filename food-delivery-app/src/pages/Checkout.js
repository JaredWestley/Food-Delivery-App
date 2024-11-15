// src/pages/Checkout.js
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { db } from '../firebaseConfig'; // Import Firestore configuration
import { collection, addDoc } from 'firebase/firestore';
import './Checkout.css';
import { useAuth } from '../AuthContext';

function Checkout({ restaurantId }) { // Pass restaurantId as a prop
  const { cartItems, updateItemQuantity, removeFromCart, clearCart } = useCart();
  const [updatedQuantity, setUpdatedQuantity] = useState({});
  const { currentUser } = useAuth();

  const handleQuantityChange = (id, value) => {
    setUpdatedQuantity({ ...updatedQuantity, [id]: value });
  };

  const handleUpdateQuantity = (id) => {
    const quantity = updatedQuantity[id];
    if (quantity > 0) {
      updateItemQuantity(id, quantity);
    }
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleProceedToPayment = async () => {
    try {
      const orderData = {
        items: cartItems.map(item => ({
          id: item.id || '',
          name: item.name || 'Unnamed Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
        })),
        total: totalPrice || 0,
        createdAt: new Date(),
        status: 'pending',
        userId: currentUser?.uid || null,
        restaurantId: restaurantId || null, // Include the restaurantId in the order
      };

      await addDoc(collection(db, 'orders'), orderData);
      alert('Order placed successfully!');
      clearCart(); // Clear the cart after placing the order
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={index} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-image" />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p>Price: ${item.price}</p>
                <div className="cart-item-actions">
                  <input
                    type="number"
                    min="1"
                    value={updatedQuantity[item.id] || item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="quantity-input"
                  />
                  <button onClick={() => handleUpdateQuantity(item.id)}>Update</button>
                  <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
                </div>
                <p>Total: ${item.price * item.quantity}</p>
              </div>
            </div>
          ))}
          <div className="total-price">
            <h3>Total: ${totalPrice.toFixed(2)}</h3>
          </div>
        </div>
      )}
      <button className="checkout-button" onClick={handleProceedToPayment}>
        Proceed to Payment
      </button>
    </div>
  );
}

export default Checkout;
