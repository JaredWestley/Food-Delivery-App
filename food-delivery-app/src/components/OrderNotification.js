import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig'; // Firestore config
import { collection, getDocs, updateDoc, query, where, doc } from 'firebase/firestore';
import { useAuth } from '../AuthContext'; // Auth context to get the current user

function OrderNotification() {
  const { currentUser } = useAuth(); // Get the current logged-in user
  const [orders, setOrders] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [orderToNotify, setOrderToNotify] = useState(null);  // Store the order to notify

  // Function to fetch orders for the current user and check for notifications
  const fetchOrders = async () => {
    if (!currentUser) return;  // Don't fetch if no user is logged in
  
    try {
      // Query orders for the current user
      const ordersRef = collection(db, 'orders'); // Correct usage for Firebase v9+
      const q = query(ordersRef, where('userId', '==', currentUser.uid)); // Filter orders by userId
      const querySnapshot = await getDocs(q); // Fetch orders using getDocs()
  
      let ordersData = [];
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        ordersData.push({ id: doc.id, ...orderData });
  
        // Check if the order status is 'order picked up' and the notification hasn't been viewed
        if (orderData.status === 'order picked up' && !orderData.usernotificationviewed) {
          setOrderToNotify({ id: doc.id, ...orderData });
          setShowNotification(true); // Show the notification
        }
      });
  
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Mark notification as viewed in Firestore
  const markAsViewed = async () => {
    if (!currentUser || !orderToNotify) return;

    try {
      const orderRef = doc(db, 'orders', orderToNotify.id);
      await updateDoc(orderRef, { usernotificationviewed: true });
      setShowNotification(false); // Hide notification after it's viewed
    } catch (error) {
      console.error("Error updating notification view status:", error);
    }
  };

  // Polling to check for updates
  useEffect(() => {
    if (!currentUser) return;  // Don't fetch if no user is logged in
    
    // Initial fetch when the component mounts
    fetchOrders();
    
    // Polling every 10 seconds
    const intervalId = setInterval(fetchOrders, 10000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [currentUser]);

  if (!showNotification || !orderToNotify) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Darken the background
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={markAsViewed}  // Close the notification when the background is clicked
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            width: '300px',
            textAlign: 'center',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
            zIndex: 1100,
          }}
        >
          <h3 style={{ marginBottom: '15px' }}>Order Notification</h3>
          <p>Your order has been picked up and is on the way!</p>
          <button
            onClick={markAsViewed}  // Mark as viewed when clicked
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default OrderNotification;
