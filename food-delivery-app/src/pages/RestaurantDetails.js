// src/pages/RestaurantDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../contexts/CartContext';
import './RestaurantDetails.css';
import CartIcon from '../components/CartIcon';

function RestaurantDetails() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const docRef = doc(db, 'restaurants', restaurantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRestaurant(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  if (!restaurant) {
    return <div>Loading...</div>;
  }

  const handleAddToCart = (item, quantity) => {
    addToCart(item, quantity);
  };

  return (
    <div className="restaurant-details">
      <CartIcon />
      <h2>{restaurant.name}</h2>
      <p>{restaurant.location}</p>
      <p>Rating: {restaurant.rating}</p>
      <div className="menu">
        <h3>Menu</h3>
        {restaurant.menu?.map((item, index) => (
          <div key={index} className="menu-item">
            <img src={item.image} alt={item.name} className="menu-item-image" />
            <div className="menu-item-info">
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <p>${item.price}</p>
              <input
                type="number"
                min="1"
                defaultValue="1"
                onChange={(e) => (item.quantity = parseInt(e.target.value))}
                className="quantity-input"
              />
              <button onClick={() => handleAddToCart(item, item.quantity || 1)}>
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantDetails;
