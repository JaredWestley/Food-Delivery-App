import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0); // Track login attempts
  const [isLocked, setIsLocked] = useState(false); // Lock the login button after 3 failed attempts
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prevent login if the account is locked
    if (isLocked) {
      setError("Account is locked due to multiple failed login attempts.");
      return;
    }

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userRole = userData.role;

        // Redirect based on the user's role
        if (userRole === "rider") {
          navigate("/rider");
        } else if (userRole === "manager") {
          navigate("/restaurant");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("User role not found.");
      }
    } catch (error) {
      // Increment attempts only on incorrect login
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1;
          if (newAttempts >= 3) {
            setIsLocked(true); // Lock the account after 3 failed attempts
            setError("Account locked after 3 failed login attempts.");
          } else {
            setError(
              `Error: Wrong login information! Attempts remaining: ${
                3 - newAttempts
              }`,
            );
          }
          return newAttempts;
        });
      } else {
        setError("Error: " + error.message);
      }
    }
  };

  // Redirect if already logged in
  if (currentUser) {
    navigate("/dashboard");
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
          disabled={isLocked} // Disable input if account is locked
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLocked} // Disable input if account is locked
        />
        <button type="submit" disabled={isLocked}>
          {isLocked ? "Account Locked" : "Login"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <button
        onClick={() => navigate("/register")}
        className="register-redirect"
        disabled={isLocked} // Disable navigation if account is locked
      >
        Don’t have an account?
      </button>
      <button
        onClick={() => navigate("/register-rest")}
        className="register-owner"
        disabled={isLocked} // Disable navigation if account is locked
      >
        Register as a Manager
      </button>
    </div>
  );
}

export default Login;
