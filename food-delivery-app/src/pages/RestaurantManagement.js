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
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

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
  const [editMode, setEditMode] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

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
            where("managerId", "==", currentUser.uid)
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
        openingTime: openingTime,
        closingTime: closingTime,
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

  const handleEditClick = (restaurant) => {
    setRestaurantName(restaurant.name);
    setRestaurantEmail(restaurant.email);
    setRestaurantLocation(restaurant.location);
    setOpeningTime(restaurant.openingTime);
    setClosingTime(restaurant.closingTime);
    setMenu(restaurant.menu || []);
    setCurrentEditingId(restaurant.id);
    setEditMode(true);
  };

  const handleUpdateRestaurant = async () => {
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

    try {
      const restaurantRef = doc(db, "restaurants", currentEditingId);

      await updateDoc(restaurantRef, {
        email: restaurantEmail,
        location: restaurantLocation,
        name: restaurantName,
        openingTime: openingTime,
        closingTime: closingTime,
        menu: menu,
      });

      alert("Restaurant updated successfully!");

      // Refresh the list of restaurants
      const q = query(
        collection(db, "restaurants"),
        where("managerId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const updatedRestaurants = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRestaurants(updatedRestaurants);

      // Reset the form
      setRestaurantName("");
      setRestaurantEmail("");
      setRestaurantLocation("");
      setOpeningTime("");
      setClosingTime("");
      setMenu([]);
      setEditMode(false);
      setCurrentEditingId(null);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      alert("Failed to update restaurant. Please try again.");
    }
  };

  const handleAddMenuItem = async () => {
    if (
      !newMenuItem.name ||
      !newMenuItem.description ||
      !newMenuItem.price ||
      !newMenuItem.image
    ) {
      alert("Please fill in all fields (name, description, price, image) for the menu item.");
      return;
    }
  
    // Add the new menu item to the state menu array
    const updatedMenu = [...menu, newMenuItem];
    setMenu(updatedMenu);
  
    // Clear the form for the new menu item
    setNewMenuItem({ name: "", description: "", price: "", image: "" });
  
    // Update the restaurant document in Firestore with the new menu array
    try {
      const restaurantRef = doc(db, "restaurants", currentEditingId); // reference to the restaurant document
      await updateDoc(restaurantRef, {
        menu: updatedMenu, // Set the updated menu array to the document
      });
      alert("Menu item added successfully!");
    } catch (error) {
      console.error("Error adding menu item:", error);
      alert("Failed to add menu item. Please try again.");
    }
  };
  

  const handleMenuItemChange = (index, key, value) => {
    const updatedMenu = [...menu];
    updatedMenu[index][key] = value;
    setMenu(updatedMenu);
  
    // After updating a menu item in the state, update Firestore
    try {
      const restaurantRef = doc(db, "restaurants", currentEditingId);
      updateDoc(restaurantRef, {
        menu: updatedMenu, // Update the menu array with the modified item
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Failed to update menu item. Please try again.");
    }
  };


  const handleDeleteMenuItem = async (index) => {
    const updatedMenu = menu.filter((_, i) => i !== index); // Remove the menu item at the specified index
    setMenu(updatedMenu); // Update the state with the modified menu array
  
    // Update the restaurant document in Firestore to remove the menu item
    try {
      const restaurantRef = doc(db, "restaurants", currentEditingId); // Reference to the restaurant document
      await updateDoc(restaurantRef, {
        menu: updatedMenu, // Set the updated menu array without the deleted item
      });
      alert("Menu item deleted successfully!");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Failed to delete menu item. Please try again.");
    }
  };

  const GoBack = async () => {
    try {
      navigate('/restaurant');
    } catch (error) {
      console.error('Error going back: ', error);
    }
  };
  

  return (
    <div>
      <h2>Restaurant Management</h2>

      <button onClick={GoBack}>Go Back</button>

      <h3>{editMode ? "Edit Restaurant" : "Create New Restaurant"}</h3>
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

        {editMode && (
          <div>
            <h4>Menu Items</h4>
            <ul>
              {menu.map((item, index) => (
                <li key={index}>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleMenuItemChange(index, "name", e.target.value)
                    }
                    placeholder="Item Name"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleMenuItemChange(index, "description", e.target.value)
                    }
                    placeholder="Item Description"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleMenuItemChange(index, "price", e.target.value)
                    }
                    placeholder="Price"
                  />
                  <input
                    type="text"
                    value={item.image}
                    onChange={(e) =>
                      handleMenuItemChange(index, "image", e.target.value)
                    }
                    placeholder="Image URL"
                  />
                  <button onClick={() => handleDeleteMenuItem(index)}>Delete</button>
                </li>
              ))}
            </ul>
            <div>
              <input
                type="text"
                placeholder="New Item Name"
                value={newMenuItem.name}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="New Item Description"
                value={newMenuItem.description}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, description: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="New Item Price"
                value={newMenuItem.price}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, price: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="New Item Image URL"
                value={newMenuItem.image}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, image: e.target.value })
                }
              />
              <button onClick={handleAddMenuItem}>Add Menu Item</button>
            </div>
          </div>
        )}

        {editMode ? (
          <button onClick={handleUpdateRestaurant}>Update Restaurant</button>
        ) : (
          <button
            onClick={handleRestaurantCreation}
            disabled={creatingRestaurant}
          >
            {creatingRestaurant ? "Creating..." : "Create Restaurant"}
          </button>
        )}
      </div>

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
                <button onClick={() => handleEditClick(restaurant)}>
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RestaurantManagement;
