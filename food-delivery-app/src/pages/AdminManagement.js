// src/pages/AdminManagement.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Import Firestore
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Firestore methods

function AdminManagement() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [users, setUsers] = useState([]); // State to store all users
  const [loading, setLoading] = useState(true); // To track if we're still fetching data
  const [selectedRoles, setSelectedRoles] = useState({}); // Store selected roles for each user

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid); // Assuming the user's UID is stored in `currentUser.uid`
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role); // Store the user's role
          } else {
            console.error('User role not found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        // Initialize selectedRoles with the current role of each user
        const initialRoles = usersList.reduce((acc, user) => {
          acc[user.id] = user.role; // Set initial role to user's current role
          return acc;
        }, {});
        setSelectedRoles(initialRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  // If we are still loading the role or the userRole is null, show a loading message
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not an 'admin', redirect them to the dashboard
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Function to handle role update
  const handleRoleChange = (userId, newRole) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: newRole // Update the selected role in the state
    }));
  };

  // Function to save the role change in Firestore
  const handleSaveRoleChange = async (userId) => {
    const newRole = selectedRoles[userId]; // Get the selected role for this user
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: newRole
      });
      console.log('Role updated successfully!');
      // You can also update the user data in state if you want to reflect changes instantly
      setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, role: newRole } : user));
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div>
      <h2>Admin Management Page</h2>
      <h3>User List</h3>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>
                <select
                  value={selectedRoles[user.id] || user.role} // Set the selected value to the current role
                  onChange={(e) => handleRoleChange(user.id, e.target.value)} // Update the selected role
                >
                  <option value="customer">Customer</option>
                  <option value="rider">Rider</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleSaveRoleChange(user.id)}>Update Role</button>
                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminManagement;
