import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import Map, { Marker } from 'react-map-gl';
import { Navigate, useNavigate } from 'react-router-dom';
import OrderNotification from '../components/OrderNotification'; // Import OrderNotification component

function UserOrders() {
  const { currentUser } = useAuth();
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 51.8985, lng: -8.4756 }); // Default to Cork coordinates
  const [showNotification, setShowNotification] = useState(false); // State to control notification visibility
  const [orderToNotify, setOrderToNotify] = useState(null); // Store the order for which we show the notification

  const navigate = useNavigate();

  // Fetch coordinates for each order based on the customer's postcode
  const fetchCoordinates = async (postcode, orderId) => {
    console.log(`Fetching coordinates for postcode: ${postcode} (Order ID: ${orderId})`);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?access_token=pk.eyJ1IjoiYXRvbW95byIsImEiOiJjbTRkNWl0NzQwazVkMmpzZW02aDZ4ZnJ4In0.D3x71LeM8qo_Pe-xAw_oHA`
      );
      const data = await response.json();
      console.log('Mapbox response:', data);
      if (data.features && data.features.length > 0) {
        const { center } = data.features[0]; // [longitude, latitude]
        setMapCoordinates({ lat: center[1], lng: center[0] });
      } else {
        console.log('No coordinates found for postcode');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
  };

  // Fetch user's orders from Firestore
  const fetchUserOrders = async () => {
    if (!currentUser) return;

    console.log('Fetching user orders for:', currentUser.uid);

    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList = await Promise.all(
        ordersSnapshot.docs.map(async (orderDoc) => {
          const orderData = orderDoc.data();
          let customerAddress = null;

          console.log(`Fetching order details for Order ID: ${orderDoc.id}`);

          // Fetch customer address using userId from the order
          if (orderData.userId) {
            const userRef = doc(db, 'users', orderData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              customerAddress = userData.address;
              console.log('Customer Address:', customerAddress);

              // If the address contains a postcode, fetch coordinates
              if (userData.address && userData.address.postcode) {
                fetchCoordinates(userData.address.postcode, orderDoc.id); // Pass order ID to store its coordinates
              }
            } else {
              console.log('User not found in Firestore');
            }
          }

          return {
            id: orderDoc.id,
            ...orderData,
            createdAt: orderData.createdAt.toDate(),
            customerAddress,
          };
        })
      );

      console.log('Fetched orders:', ordersList);
      setUserOrders(ordersList);

      // Check if any order has the status "order picked up" and "usernotificationviewed" is false
      ordersList.forEach((order) => {
        if (order.status === 'order picked up' && !order.usernotificationviewed) {
          setOrderToNotify(order); // Set the order to notify
          setShowNotification(true); // Show the notification
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const GoBack = async () => {
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Error going back: ', error);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered');
    if (currentUser) {
      console.log('Fetching orders for current user');
      fetchUserOrders();
    } else {
      console.log('No current user found');
    }
    setLoading(false);
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

  if (loading) {
    console.log('Loading state: true');
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    console.log('No current user, redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('Rendering Orders');
  return (
    <div>
      <h2>Your Orders</h2>

      <button onClick={GoBack}>Go Back</button>

      {userOrders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <ul>
          {userOrders.map((order) => (
            <li key={order.id}>
              <h4>Order ID: {order.id}</h4>
              <p>Restaurant ID: {order.restaurantID}</p>
              <p>Items:</p>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} x {item.quantity} (Price: ${item.price})
                  </li>
                ))}
              </ul>
              <p>Total: ${order.total}</p>
              <p>Status: {order.status}</p>
              <p>Order placed on: {order.createdAt.toLocaleString()}</p>

              {order.customerAddress ? (
                <div>
                  <h5>Customer Address:</h5>
                  <p>
                    {order.customerAddress.firstLine}, {order.customerAddress.secondLine}
                  </p>
                  <p>
                    {order.customerAddress.city}, {order.customerAddress.county}, {order.customerAddress.postcode}
                  </p>
                  <p>{order.customerAddress.country}</p>
                </div>
              ) : (
                <p>Address not available</p>
              )}

              {/* Display Map for each order */}
              <div style={{ height: '400px' }}>
                <Map
                  initialViewState={{
                    latitude: mapCoordinates.lat,
                    longitude: mapCoordinates.lng,
                    zoom: 14,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v11"
                  mapboxAccessToken="pk.eyJ1IjoiYXRvbW95byIsImEiOiJjbTRkNWl0NzQwazVkMmpzZW02aDZ4ZnJ4In0.D3x71LeM8qo_Pe-xAw_oHA"
                >
                  <Marker latitude={mapCoordinates.lat} longitude={mapCoordinates.lng}>
                    <div>📍</div>
                  </Marker>
                </Map>
              </div>

              {order.status === 'order picked up' && !order.usernotificationviewed && showNotification && order.id === orderToNotify?.id && (
                <OrderNotification
                  orderId={orderToNotify.id}
                  message="Your order has been picked up!"
                  onDismiss={handleNotificationDismiss}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserOrders;
