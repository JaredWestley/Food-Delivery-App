// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'; // Firestore methods
import { useAuth } from '../AuthContext';
import RestaurantTile from '../components/RestaurantTile';
import CartIcon from '../components/CartIcon';
import { Navigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // To track if we're still fetching data

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const restaurantsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error('Error fetching restaurants: ', error);
      }
    };

    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role); // Store the user's role
          } else {
            console.error('User role not found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchUserRole();
      fetchRestaurants();
    } else {
      setLoading(false); // If there's no current user, we can stop loading
    }
  }, [currentUser]);

  // If we are still loading the role or the userRole is null, show a loading message
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a more sophisticated loading indicator
  }

  // If user is not logged in or has no role, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Redirect based on user role
  if (userRole === 'rider') {
    return <Navigate to="/rider" />;
  }
  if (userRole === 'manager') {
    return <Navigate to="/restaurant" />;
  }
  if (userRole === 'admin') {
    return <Navigate to="/admin" />;
  }

  // Handle the dashboard view when the user is logged in and doesn't have a specific role
  return (
    <div className="dashboard">
      <CartIcon />
      <div className="dashboard-header">
        <h2>Welcome, {currentUser?.email}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="restaurant-tiles-container">
        {restaurants.map(restaurant => (
          <RestaurantTile key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
