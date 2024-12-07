import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, getDocs, updateDoc, collection, query, where } from 'firebase/firestore'; // Firestore methods
import { useAuth } from '../AuthContext';
import RestaurantTile from '../components/RestaurantTile';
import CartIcon from '../components/CartIcon';
import OrderNotification from '../components/OrderNotification';
import { Navigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]); // Stores filtered results
  const [searchQuery, setSearchQuery] = useState(''); // For search input
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // To track if we're still fetching data
  const [userOrders, setUserOrders] = useState([]);
  const [showNotification, setShowNotification] = useState(false); // To trigger the notification
  const [orderToNotify, setOrderToNotify] = useState(null); // Stores the order that has been picked up

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  const GoOrders = async () => {
    try {
      navigate('/user-orders');
    } catch (error) {
      console.error('Error going to orders: ', error);
    }
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const restaurantsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(restaurantsData);
        setFilteredRestaurants(restaurantsData); // Initially, display all restaurants
      } catch (error) {
        console.error('Error fetching restaurants: ', error);
      }
    };

    if (currentUser) {
      // Fetch user's orders from Firestore
      const fetchOrders = async () => {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('userId', '==', currentUser.uid)); // Get orders of the current user
          const querySnapshot = await getDocs(q);
          const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserOrders(orders);

          // Check if any order is 'order picked up' and 'usernotificationviewed' is false
          orders.forEach(order => {
            if (order.status === 'order picked up' && !order.usernotificationviewed) {
              setOrderToNotify(order); // Set the order to notify
              setShowNotification(true); // Show the notification
            }
          });
        } catch (error) {
          console.error("Error fetching user orders:", error);
        }
      };
      fetchOrders();
    }

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

  // Handle notification dismissal and update Firestore
  const handleNotificationDismiss = async () => {
    if (orderToNotify) {
      // Set 'usernotificationviewed' to true in Firestore for this order
      const orderRef = doc(db, 'orders', orderToNotify.id);
      await updateDoc(orderRef, {
        usernotificationviewed: true,
      });

      // Hide the notification
      setShowNotification(false);
    }
  };

  // Filter restaurants based on the search query
  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
    const filtered = restaurants.filter((restaurant) => {
      // Check if the query matches name, location, or menu items
      const matchesName = restaurant.name.toLowerCase().includes(query);
      const matchesLocation = restaurant.location.toLowerCase().includes(query);
      const matchesMenu = restaurant.menu.some((item) =>
        item.name.toLowerCase().includes(query)
      );
      return matchesName || matchesLocation || matchesMenu;
    });
    setFilteredRestaurants(filtered);
  };

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
        {userOrders.map(order => (
          <div key={order.id}>
            {/* Add OrderNotification component here if showNotification is true */}
            {showNotification && orderToNotify && orderToNotify.id === order.id && (
              <OrderNotification
                orderId={orderToNotify.id}
                message="Your order has been picked up!"
                onDismiss={handleNotificationDismiss}
              />
            )}
            {/* Render other order details */}
          </div>
        ))}
        <button onClick={handleLogout}>Logout</button>
        <button onClick={GoOrders}>Go to Orders</button>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search restaurants by name, location, or menu items..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="restaurant-tiles-container">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant) => (
            <RestaurantTile key={restaurant.id} restaurant={restaurant} />
          ))
        ) : (
          <p>No restaurants match your search criteria.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
