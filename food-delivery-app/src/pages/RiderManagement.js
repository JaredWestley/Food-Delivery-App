// src/pages/RiderManagement.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import { db } from '../firebaseConfig';  // Import Firestore
import { doc, getDoc } from 'firebase/firestore'; // Firestore methods

function RiderManagement() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);  // To track if we're still fetching data

  useEffect(() => {
    // Only fetch the role if the user is logged in
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid); // Assuming the user's UID is stored in `currentUser.uid`
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role); // Store the user's role
            console.log('User Role:', userData.role); // Log to see the fetched role
          } else {
            console.error('User role not found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setLoading(false); // Set loading to false once the data is fetched
    };

    if (currentUser) {
      fetchUserRole();
    } else {
      setLoading(false); // If there's no current user, we can stop loading
    }
  }, [currentUser]);

  // If we are still loading the role or the userRole is null, we can show a loading spinner or just wait
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a more sophisticated loading indicator
  }

  // If the user is not a 'rider', redirect them to the dashboard
  if (userRole !== 'rider') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <h2>Rider Management Page</h2>
      {/* Your page content */}
    </div>
  );
}

export default RiderManagement;
