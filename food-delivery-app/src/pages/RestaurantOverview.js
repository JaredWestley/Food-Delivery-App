// RestaurantOverview.js

import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

function RestaurantOverview() {
  const navigate = useNavigate();

  const handleOrdersClick = () => {
    navigate("/orders"); // Navigate to the Orders page
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const handleManageRestaurantsClick = () => {
    navigate("/restaurantmanagement"); // Navigate to the Restaurant Management page
  };

  return (
    <div>
      <h2>Restaurant Overview</h2>
      <button onClick={handleLogout}>Logout</button>
      <div>
        <button onClick={handleOrdersClick}>Orders</button>
      </div>
      <div>
        <button onClick={handleManageRestaurantsClick}>
          Manage Restaurants
        </button>
      </div>
    </div>
  );
}

export default RestaurantOverview;
