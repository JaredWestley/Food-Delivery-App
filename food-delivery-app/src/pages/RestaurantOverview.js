// RestaurantOverview.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

function RestaurantOverview() {
  const navigate = useNavigate();

  const handleOrdersClick = () => {
    navigate('/orders'); // Navigate to the Orders page
  };

  const handleManageRestaurantsClick = () => {
    navigate('/restaurantmanagement'); // Navigate to the Restaurant Management page
  };

  return (
    <div>
      <h2>Restaurant Overview</h2>
      <div>
        <button onClick={handleOrdersClick}>Orders</button>
      </div>
      <div>
        <button onClick={handleManageRestaurantsClick}>Manage Restaurants</button>
      </div>
    </div>
  );
}

export default RestaurantOverview;
