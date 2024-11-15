// src/components/RestaurantTile.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantTile.css';

function RestaurantTile({ restaurant }) {
  const navigate = useNavigate();

  const openRestaurantDetails = () => {
    navigate(`/restaurants/${restaurant.id}`);
  };

  return (
    <div className="restaurant-tile" onClick={openRestaurantDetails}>
      <img src={restaurant.image} alt={restaurant.name} className="restaurant-image" />
      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.location}</p>
        <p>Rating: {restaurant.rating}</p>
      </div>
    </div>
  );
}

export default RestaurantTile;
