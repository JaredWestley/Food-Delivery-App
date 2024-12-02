import React from 'react';
import { useCart } from '../contexts/CartContext';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Ensure restaurantId is available or redirect to another page
  const restaurantId = location.state?.restaurantId;
  if (!restaurantId) {
    alert('Restaurant ID is missing. Redirecting to dashboard.');
    navigate('/dashboard'); // Redirect to dashboard or an appropriate fallback page
    return null;
  }

  const handleProceedToPayment = async () => {
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
        // createdAt: new Date(),
        status: 'pending',
        userId: currentUser?.uid,
        restaurantID: restaurantId, // Save the restaurantID here
      };

      await addDoc(collection(db, 'orders'), orderData);
      alert('Order placed successfully!');
      clearCart();
      navigate('/dashboard'); // Redirect after successful order placement
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <button onClick={handleProceedToPayment}>Proceed to Payment</button>
    </div>
  );
}

export default Checkout;
