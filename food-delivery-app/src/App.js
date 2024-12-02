// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RestaurantDetails from './pages/RestaurantDetails';
import Checkout from './pages/Checkout'; 
import RiderManagement from './pages/RiderManagement';
import RestaurantManagement from './pages/RestaurantManagement';
import RestaurantOverview from './pages/RestaurantOverview';
import RestaurantOrders from './pages/RestaurantOrders';
import AdminManagement from './pages/AdminManagement';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './contexts/CartContext';


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">

            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/restaurants/:restaurantId" element={<RestaurantDetails />} />
              <Route path="/checkout" element={<Checkout />} /> 
              <Route path="/restaurant" element={<RestaurantOverview />} /> 
              <Route path="restaurantmanagement" element={<RestaurantManagement/>} />
              <Route path="restaurantorders" element={<RestaurantOrders/>} />
              <Route path="/rider" element={<RiderManagement />} /> 
              <Route path="/admin" element={<AdminManagement/>} />
              <Route path="/orders" element={<RestaurantOrders/>} /> 
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
