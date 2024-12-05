import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import './Register.css'; // Add custom CSS for better styling

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState({
    firstLine: '',
    secondLine: '',
    city: '',
    county: '',
    country: '',
    postcode: '',
  });
  const [gender, setGender] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [role] = useState('customer');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleAddressChange = (field, value) => {
    setAddress((prevAddress) => ({ ...prevAddress, [field]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        role: role,
        address: address,
        gender: gender,
        dietaryRequirements: dietaryRequirements,
        userid: user.uid,
      });

      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  if (currentUser) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Register</h2>
      <form onSubmit={handleRegister} className="register-form">
        {/* Name and Email */}
        <div className="form-section">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Fields */}
        <div className="form-section">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {/* Address Fields */}
        <div className="form-section">
          <h3>Address</h3>
          <label htmlFor="first-line">First Line</label>
          <input
            type="text"
            id="first-line"
            placeholder="Street address"
            value={address.firstLine}
            onChange={(e) => handleAddressChange('firstLine', e.target.value)}
            required
          />

          <label htmlFor="second-line">Second Line</label>
          <input
            type="text"
            id="second-line"
            placeholder="Apartment, suite, etc. (optional)"
            value={address.secondLine}
            onChange={(e) => handleAddressChange('secondLine', e.target.value)}
          />

          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            placeholder="Enter your city"
            value={address.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            required
          />

          <label htmlFor="county">County</label>
          <input
            type="text"
            id="county"
            placeholder="Enter your county (optional)"
            value={address.county}
            onChange={(e) => handleAddressChange('county', e.target.value)}
          />

          <label htmlFor="country">Country</label>
          <select
            id="country"
            value={address.country}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            required
          >
            <option value="" disabled>Select your country</option>
            <option value="IE">Ireland</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="IE">Italy</option>
            <option value="IE">Ireland</option>
            <option value="IE">Ireland</option>
            <option value="IE">Ireland</option>
            <option value="UK">United Kingdom</option>
            <option value="US">United States</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="postcode">Postcode</label>
          <input
            type="text"
            id="postcode"
            placeholder="Enter your postcode"
            value={address.postcode}
            onChange={(e) => handleAddressChange('postcode', e.target.value)}
            required
          />
        </div>

        {/* Gender Dropdown */}
        <div className="form-section">
          <h3>Gender</h3>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="" disabled>Select your gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        {/* Dietary Requirements */}
        <div className="form-section">
          <h3>Dietary Requirements</h3>
          <textarea
            id="dietary-requirements"
            placeholder="Enter any dietary requirements (optional)"
            value={dietaryRequirements}
            onChange={(e) => setDietaryRequirements(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-button">Register</button>
        {error && <p className="error">{error}</p>}
      </form>

      {/* Redirect to Login */}
      <button onClick={() => navigate('/login')} className="login-redirect">
        Already have an account?
      </button>
    </div>
  );
}

export default Register;
