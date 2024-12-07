import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

function RestaurantOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  const navigate = useNavigate();

  // Function to update the order status
  const updateOrderStatus = async (orderId, newStatus, riderId = null) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
      const updateData = {
        status: newStatus,
      };

      if (riderId) {
        updateData.riderId = riderId; // Assign the rider to the order
      }

      await updateDoc(orderRef, updateData);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, riderId } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const fetchOrders = async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          // const userRestaurantID = userData.restaurantID;
          const managerID = userData.userid;

          const ordersQuery = query(collection(db, 'orders'));
          const querySnapshot = await getDocs(ordersQuery);

          const ordersList = [];
          const promises = [];

          querySnapshot.forEach((orderDoc) => {
            const orderData = orderDoc.data();
            const orderRestaurantID = orderData?.restaurantID;
            const customerId = orderData?.userId;

            if (orderRestaurantID) {
              const restaurantRef = doc(db, 'restaurants', orderRestaurantID);
              promises.push(
                getDoc(restaurantRef).then((restaurantDocSnap) => {
                  if (restaurantDocSnap.exists()) {
                    const restaurantData = restaurantDocSnap.data();

                    if (restaurantData.managerId === managerID) {
                      const customerRef = doc(db, 'users', customerId);
                      return getDoc(customerRef).then((customerDocSnap) => {
                        let customerName = '';
                        if (customerDocSnap.exists()) {
                          customerName = customerDocSnap.data().name;
                        } else {
                          console.error('Customer not found');
                        }

                        ordersList.push({
                          id: orderDoc.id,
                          customerName,
                          items: orderData.items,
                          total: orderData.total,
                          status: orderData.status,
                          riderId: orderData.riderId || '',
                          createdAt: orderData.createdAt.toDate(), // Store the date for filtering
                        });
                      });
                    }
                  } else {
                    console.error('Restaurant not found with ID:', orderRestaurantID);
                  }
                })
              );
            }
          });

          await Promise.all(promises);

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

  const fetchRiders = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'rider'));
      const querySnapshot = await getDocs(usersQuery);

      const riderList = [];
      querySnapshot.forEach((doc) => {
        riderList.push({
          id: doc.id,
          name: doc.data().name,
        });
      });

      setRiders(riderList);
    } catch (error) {
      console.error('Error fetching riders:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const GoBack = async () => {
    try {
      navigate('/restaurant');
    } catch (error) {
      console.error('Error going back: ', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchRiders();
  }, [currentUser]);

  useEffect(() => {
    // Filter orders based on the search query
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = orders.filter((order) => {
      return (
        order.customerName.toLowerCase().includes(lowerCaseQuery) ||
        order.status.toLowerCase().includes(lowerCaseQuery) ||
        order.createdAt.toLocaleString().toLowerCase().includes(lowerCaseQuery)
      );
    });
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Incoming Orders</h2>
      
      <button onClick={GoBack}>Go Back</button>

      {/* Search Bar */}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search by customer name, status, or date"
      />

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {filteredOrders.map((order) => (
            <li key={order.id}>
              <h4>Order ID: {order.id}</h4>
              <p>Customer: {order.customerName}</p>
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

              {/* Dropdown to assign rider */}
              {order.status !== 'delivering' && (
                <div>
                  <select
                    value={selectedRider}
                    onChange={(e) => setSelectedRider(e.target.value)}
                    disabled={order.status === 'delivering'}
                  >
                    <option value="">Assign a Rider</option>
                    {riders.map((rider) => (
                      <option
                        key={rider.id}
                        value={rider.id}
                        disabled={rider.id === order.riderId} // Disable if rider is already assigned
                        style={{
                          color: rider.id === order.riderId ? 'grey' : 'black', // Style greyed-out options
                        }}
                      >
                        {rider.name} {rider.id === order.riderId ? '(Already Assigned)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedRider) {
                        updateOrderStatus(order.id, 'delivering', selectedRider);
                      } else {
                        alert('Please select a rider!');
                      }
                    }}
                  >
                    Assign
                  </button>
                </div>
              )}


              <div>
                <button onClick={() => updateOrderStatus(order.id, 'pending')}>Pending</button>
                <button onClick={() => updateOrderStatus(order.id, 'making')}>Making</button>
                <button onClick={() => updateOrderStatus(order.id, 'ready')}>Ready</button>
                <button onClick={() => updateOrderStatus(order.id, 'cancel')}>Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RestaurantOrders;
