import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './RestaurantDetails.css';

function RestaurantDetails() {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name'); // Default search field
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantsCollection = collection(db, 'restaurants');
        const querySnapshot = await getDocs(restaurantsCollection);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(data);
        setFilteredRestaurants(data);
        console.log(data); // Check if the data is fetched correctly
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };

    fetchRestaurants();
  }, []);

  const handleSearch = () => {
    const lowerCasedTerm = searchTerm.toLowerCase();
    const filtered = restaurants.filter((restaurant) => {
      if (searchField === 'name') {
        return restaurant.name.toLowerCase().includes(lowerCasedTerm);
      } else if (searchField === 'location') {
        return restaurant.location.toLowerCase().includes(lowerCasedTerm);
      } else if (searchField === 'menu') {
        return restaurant.menu.some((item) =>
          item.name.toLowerCase().includes(lowerCasedTerm)
        );
      }
      return false;
    });
    setFilteredRestaurants(filtered);
  };

  const handleNavigate = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="restaurant-details-page">
      <div>
        <h1>Restaurant Search</h1> {/* Add title for clarity */}
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          className="search-field-dropdown"
        >
          <option value="name">Name</option>
          <option value="location">Location</option>
          <option value="menu">Menu Items</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>

      {/* Restaurant Tiles */}
      <div className="restaurant-list">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="restaurant-card"
            onClick={() => handleNavigate(restaurant.id)}
          >
            <img
              src={
                restaurant.menu?.[0]?.image ||
                'https://via.placeholder.com/150' // Default image if no menu images are available
              }
              alt={restaurant.name}
              className="restaurant-image"
            />
            <div className="restaurant-info">
              <h2>{restaurant.name}</h2>
              <p>Location: {restaurant.location}</p>
              <p>Rating: {restaurant.rating}</p>
              <p>
                Menu Items:{' '}
                {restaurant.menu
                  .map((item) => item.name)
                  .slice(0, 3)
                  .join(', ')}
                {restaurant.menu.length > 3 ? '...' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantDetails;
