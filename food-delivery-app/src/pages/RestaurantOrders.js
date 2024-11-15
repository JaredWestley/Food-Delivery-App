// RestaurantOrders.js

import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

function RestaurantOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (currentUser) {
        try {
          // Get the manager's restaurantID
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const restaurantID = userData.restaurantID;

            // Query orders where the restaurantID matches
            const q = query(collection(db, 'orders'), where('restaurantID', '==', restaurantID));
            const querySnapshot = await getDocs(q);

            const ordersList = [];
            querySnapshot.forEach((doc) => {
              ordersList.push({ id: doc.id, ...doc.data() });
            });

            setOrders(ordersList);
          } else {
            console.error('User not found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, [currentUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Incoming Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <h4>Order ID: {order.id}</h4>
              <p>Customer: {order.customerName}</p>
              <p>Items: {order.items.join(', ')}</p>
              <p>Total: ${order.total}</p>
              <p>Status: {order.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RestaurantOrders;
