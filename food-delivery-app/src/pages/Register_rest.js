import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

function Register_rest() {
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [role] = useState("manager"); // Default role for restaurant owners

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        ownerName: ownerName,
        email: email,
        phone: phone,
        role: role, // Set role to 'owner'
        userid: user.uid, // Store the Firebase UID as the unique user ID
      });

      // Redirect to the restaurant management page or dashboard
      navigate("/restaurantmanagement");
    } catch (error) {
      setError(error.message);
    }
  };

  // Redirect if already logged in
  if (currentUser) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="form-container">
      <h2>Register as Restaurant Owner</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Owner Name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        {error && <p className="error">{error}</p>}
      </form>
      <button onClick={() => navigate("/login")} className="login-redirect">
        Already have an account?
      </button>
    </div>
  );
}

export default Register_rest;
