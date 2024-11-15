import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';  // Import Firestore
import { doc, getDoc, setDoc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore'; 
import { v4 as uuidv4 } from 'uuid'; // To generate unique IDs for restaurants

function RestaurantManagement() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', description: '', price: '', image: '' });
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [restaurantID, setRestaurantID] = useState(null);  // State to store the newly created restaurant ID
  const [restaurants, setRestaurants] = useState([]);  // Store list of restaurants the manager created
  const [isManagingMenu, setIsManagingMenu] = useState(false); // State to track if the menu management section is visible
  const [editingMenuItem, setEditingMenuItem] = useState(null); // State to track the item being edited
  const navigate = useNavigate();  // For redirecting after restaurant creation

  useEffect(() => {
    // Only fetch the role and restaurants if the user is logged in
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          // Fetch user role
          const userRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role); // Store the user's role
          } else {
            console.error('User role not found in Firestore');
          }

          // Fetch the restaurants created by the current user (manager)
          const q = query(collection(db, "restaurants"), where("managerId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          const restaurantList = [];
          querySnapshot.forEach((doc) => {
            restaurantList.push({ id: doc.id, ...doc.data() });
          });
          setRestaurants(restaurantList);
        } catch (error) {
          console.error('Error fetching user data:', error);
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

  // If we are still loading the role or the userRole is null, we can show a loading spinner or just wait
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not a 'manager', redirect them to the dashboard
  if (userRole !== 'manager') {
    return <Navigate to="/dashboard" />;
  }

  const handleRestaurantCreation = async () => {
    setCreatingRestaurant(true);

    try {
      // Generate a unique restaurant ID
      const newRestaurantID = uuidv4();
      setRestaurantID(newRestaurantID);  // Set the generated restaurant ID to state

      // Create a new restaurant document in Firestore and link it to the manager
      const restaurantRef = doc(db, 'restaurants', newRestaurantID);
      await setDoc(restaurantRef, {
        email: restaurantEmail,
        location: restaurantLocation,
        name: restaurantName,
        restaurantID: newRestaurantID,
        menu: [], // Start with an empty menu
        rating: '0', // Default rating
        managerId: currentUser.uid, // Link this restaurant to the current manager
      });

      // Update the 'users' document to associate the manager with the newly created restaurant
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await setDoc(userRef, {
          restaurantID: newRestaurantID, // Link this restaurant to the manager's user
        }, { merge: true });
      }

      setCreatingRestaurant(false);
      navigate('/restaurant');  // Navigate to the restaurant page or dashboard after creating the restaurant
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setCreatingRestaurant(false);
    }
  };

  const handleSelectRestaurant = (restaurantId) => {
    setRestaurantID(restaurantId);
    const selectedRestaurant = restaurants.find(restaurant => restaurant.id === restaurantId);
    if (selectedRestaurant) {
      setMenuItems(selectedRestaurant.menu); // Load the menu for the selected restaurant
      setIsManagingMenu(true); // Show the menu management section
    }
  };

  const handleAddMenuItem = () => {
    if (editingMenuItem) {
      // Update the existing menu item
      const updatedMenuItems = menuItems.map((item) =>
        item.name === editingMenuItem.name ? newMenuItem : item
      );
      setMenuItems(updatedMenuItems);
      setEditingMenuItem(null); // Clear the editing state
    } else {
      // Add a new menu item
      setMenuItems([...menuItems, newMenuItem]);
    }

    setNewMenuItem({ name: '', description: '', price: '', image: '' }); // Clear the form fields
  };

  const handleEditMenuItem = (item) => {
    setEditingMenuItem(item); // Set the item to be edited
    setNewMenuItem(item); // Populate the form with the current item's details
  };

  const handleDeleteMenuItem = (itemName) => {
    const updatedMenuItems = menuItems.filter((item) => item.name !== itemName);
    setMenuItems(updatedMenuItems);

    // Remove the deleted item from Firestore
    const restaurantRef = doc(db, 'restaurants', restaurantID);
    updateDoc(restaurantRef, {
      menu: updatedMenuItems, // Update the restaurant's menu in Firestore
    });
  };

  const handleSaveMenu = async () => {
    if (!restaurantID) {
      console.error('No restaurant ID available to save the menu');
      return;
    }

    const restaurantRef = doc(db, 'restaurants', restaurantID); // Use the restaurantID from the state
    try {
      await updateDoc(restaurantRef, {
        menu: menuItems,  // Save the menu items to the restaurant document
      });
      console.log('Menu updated successfully!');
      setIsManagingMenu(false); // Close the menu management section after saving the menu
    } catch (error) {
      console.error('Error saving menu:', error);
    }
  };

  return (
    <div>
      <h2>Restaurant Management Page</h2>

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
        <button onClick={handleRestaurantCreation} disabled={creatingRestaurant}>
          {creatingRestaurant ? 'Creating...' : 'Create Restaurant'}
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
                {restaurant.id !== restaurantID && (
                  <button onClick={() => handleSelectRestaurant(restaurant.id)}>Manage Menu</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manage Menu Section */}
      {isManagingMenu && (
        <div>
          <h3>Manage Menu</h3>
          <div>
            <input
              type="text"
              placeholder="Item Name"
              value={newMenuItem.name}
              onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Item Description"
              value={newMenuItem.description}
              onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Item Price"
              value={newMenuItem.price}
              onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
            />
            <input
              type="text"
              placeholder="Item Image URL"
              value={newMenuItem.image}
              onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target.value })}
            />
            <button onClick={handleAddMenuItem}>
              {editingMenuItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>

          {/* Menu Items List */}
          <div>
            <h4>Menu Items</h4>
            <ul>
              {menuItems.map((item, index) => (
                <li key={index}>
                  <h5>{item.name}</h5>
                  <p>{item.description}</p>
                  <p>${item.price}</p>
                  <button onClick={() => handleEditMenuItem(item)}>Edit</button>
                  <button onClick={() => handleDeleteMenuItem(item.name)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Save Menu */}
          <button onClick={handleSaveMenu}>Save Menu</button>
        </div>
      )}
    </div>
  );
}

export default RestaurantManagement;
