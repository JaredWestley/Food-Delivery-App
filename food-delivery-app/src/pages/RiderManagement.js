import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import Map, { Marker } from 'react-map-gl';

function RiderManagement() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]); // Assigned orders
  const [acceptedOrders, setAcceptedOrders] = useState([]); // Accepted orders
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 51.8985, lng: -8.4756 }); // Default to Cork coordinates
  const [loadingMap, setLoadingMap] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role);
            console.log('User Role:', userData.role);
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
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  const fetchCoordinates = async (postcode) => {
    try {
      setLoadingMap(true);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?access_token=pk.eyJ1IjoiYXRvbW95byIsImEiOiJjbTRkNWl0NzQwazVkMmpzZW02aDZ4ZnJ4In0.D3x71LeM8qo_Pe-xAw_oHA`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const { center } = data.features[0]; // [longitude, latitude]
        setMapCoordinates({ lat: center[1], lng: center[0] });
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    } finally {
      setLoadingMap(false);
    }
  };

  const fetchOrders = async () => {
    if (!currentUser) return;
  
    try {
      const assignedQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'delivering'),
        where('riderId', '==', currentUser.uid)
      );
      const assignedSnapshot = await getDocs(assignedQuery);
  
      const assignedList = await Promise.all(
        assignedSnapshot.docs.map(async (orderDoc) => {
          const orderData = orderDoc.data();
          let customerAddress = null;
  
          // Fetch customer address using userId from the order
          if (orderData.userId) {
            const userRef = doc(db, 'users', orderData.userId); // Ensure 'userId' matches case in Firestore
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              customerAddress = userData.address; // Extract address
              // Fetch coordinates if the address has a postcode
              if (userData.address && userData.address.postcode) {
                fetchCoordinates(userData.address.postcode);
              }
            }
          }
  
          return {
            id: orderDoc.id,
            ...orderData,
            createdAt: orderData.createdAt.toDate(),
            customerAddress, // Include the address
          };
        })
      );
  
      const acceptedQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'order picked up'),
        where('riderId', '==', currentUser.uid)
      );
      const acceptedSnapshot = await getDocs(acceptedQuery);
  
      const acceptedList = await Promise.all(
        acceptedSnapshot.docs.map(async (orderDoc) => {
          const orderData = orderDoc.data();
          let customerAddress = null;
  
          if (orderData.userId) {
            const userRef = doc(db, 'users', orderData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              customerAddress = userData.address;
              // Fetch coordinates if the address has a postcode
              if (userData.address && userData.address.postcode) {
                fetchCoordinates(userData.address.postcode);
              }
            }
          }
  
          return {
            id: orderDoc.id,
            ...orderData,
            createdAt: orderData.createdAt.toDate(),
            customerAddress, // Include the address
          };
        })
      );
  
      setOrders(assignedList);
      setAcceptedOrders(acceptedList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  

  const handleAcceptOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'order picked up',
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ready',
        riderId: '',
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error declining order:', error);
    }
  };

  useEffect(() => {
    if (currentUser && userRole === 'rider') {
      fetchOrders();
    }
  }, [currentUser, userRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (userRole !== 'rider') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <h2>Assigned Orders</h2>
      
      <button onClick={handleLogout}>Logout</button>

      {orders.length === 0 ? (
        <p>You don't have any orders assigned yet.</p>
      ) : (
        <ul>
          {orders.map((order) => (
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

              <div>
                <button onClick={() => handleAcceptOrder(order.id)}>Accept</button>
                <button onClick={() => handleDeclineOrder(order.id)}>Decline</button>
              </div>
            </li>
          ))}

        </ul>


      )}

      <h2>Accepted Orders</h2>

      {acceptedOrders.length === 0 ? (
        <p>No accepted orders yet.</p>
      ) : (
        <ul>
          {acceptedOrders.map((order) => (
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
            </li>
          ))}
        </ul>
      )}

      {/* Display Mapbox Map */}
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
    </div>
  );
}

export default RiderManagement;
