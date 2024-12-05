import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid"; // To generate unique IDs for restaurants

function RestaurantManagement() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [restaurantLocation, setRestaurantLocation] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          // Fetch user role
          const userRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role);
          } else {
            console.error("User role not found in Firestore");
          }

          // Fetch restaurants created by the current user
          const q = query(
            collection(db, "restaurants"),
            where("managerId", "==", currentUser.uid),
          );
          const querySnapshot = await getDocs(q);
          const restaurantList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRestaurants(restaurantList);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // If we are still loading, show a loading spinner
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not a manager, redirect to the dashboard
  if (userRole !== "manager") {
    return <Navigate to="/dashboard" />;
  }

  const handleRestaurantCreation = async () => {
    if (
      !restaurantName ||
      !restaurantEmail ||
      !restaurantLocation ||
      !openingTime ||
      !closingTime
    ) {
      alert("Please fill in all fields, including opening and closing times.");
      return;
    }

    setCreatingRestaurant(true);

    try {
      const newRestaurantID = uuidv4();

      // Create a new restaurant document in Firestore
      const restaurantRef = doc(db, "restaurants", newRestaurantID);
      await setDoc(restaurantRef, {
        email: restaurantEmail,
        location: restaurantLocation,
        name: restaurantName,
        restaurantID: newRestaurantID,
        menu: [], // Start with an empty menu
        rating: "0", // Default rating
        openingTime: openingTime, // Add opening time
        closingTime: closingTime, // Add closing time
        managerId: currentUser.uid, // Link to the current manager
      });

      alert("Restaurant created successfully!");
      navigate("/restaurant"); // Navigate to the restaurant page or dashboard
    } catch (error) {
      console.error("Error creating restaurant:", error);
      alert("Failed to create restaurant. Please try again.");
    } finally {
      setCreatingRestaurant(false);
    }
  };

  return (
    <div>
      <h2>Restaurant Management</h2>

      {/* Create New Restaurant */}
      <h3>Create New Restaurant</h3>
      <div>
        <input
          type="text"
          placeholder="Restaurant Name"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Restaurant Email"
          value={restaurantEmail}
          onChange={(e) => setRestaurantEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Restaurant Location"
          value={restaurantLocation}
          onChange={(e) => setRestaurantLocation(e.target.value)}
        />
        <div>
          <label>Opening Time:</label>
          <input
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
          />
        </div>
        <div>
          <label>Closing Time:</label>
          <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
          />
        </div>
        <button
          onClick={handleRestaurantCreation}
          disabled={creatingRestaurant}
        >
          {creatingRestaurant ? "Creating..." : "Create Restaurant"}
        </button>
      </div>

      {/* List of Created Restaurants */}
      <h3>Your Restaurants</h3>
      <div>
        {restaurants.length === 0 ? (
          <p>You haven't created any restaurants yet.</p>
        ) : (
          <ul>
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <h4>{restaurant.name}</h4>
                <p>{restaurant.location}</p>
                <p>Opening: {restaurant.openingTime}</p>
                <p>Closing: {restaurant.closingTime}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RestaurantManagement;
