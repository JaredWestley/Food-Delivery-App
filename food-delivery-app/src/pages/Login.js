// src/pages/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig'; // Import Firestore
import { doc, getDoc } from 'firebase/firestore'; // Firestore methods

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userRole = userData.role;

        // Redirect based on the user's role
        if (userRole === "rider") {
          navigate('/rider');
        } else if (userRole === "manager") {
          navigate('/restaurant');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Handle case where user doesn't have a role (shouldn't happen normally)
        setError("User role not found.");
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('Error: Wrong login information!');
      } else {
        setError('Error: ' + error.message);
      }
    }
  };

  // Redirect if already logged in
  if (currentUser) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="form-container">
      <div className="app-title">Food Delivery App</div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
      <button
        onClick={() => navigate('/register')}
        className="register-redirect"
      >
        Don’t have an account?
      </button>
    </div>
  );
}

export default Login;
