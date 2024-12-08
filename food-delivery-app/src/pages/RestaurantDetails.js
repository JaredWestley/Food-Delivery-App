import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../AuthContext';
import './RestaurantDetails.css';
import CartIcon from '../components/CartIcon';

function RestaurantDetails() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { currentUser } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const docRef = doc(db, 'restaurants', restaurantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRestaurant(docSnap.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      }
    };

    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, `restaurants/${restaurantId}/reviews`);
        const reviewsSnap = await getDocs(reviewsRef);
        const reviewsData = reviewsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchRestaurant();
    fetchReviews();
    setLoading(false);
  }, [restaurantId]);

  const handleAddToCart = (item, quantity) => {
    addToCart(item, quantity, restaurantId);
  };

  const GoBack = async () => {
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Error going back: ', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('You must be logged in to submit a review.');
      return;
    }

    try {
      const reviewRef = collection(db, `restaurants/${restaurantId}/reviews`);
      await addDoc(reviewRef, {
        userId: currentUser.uid,
        rating: newReview.rating,
        comment: newReview.comment,
        timestamp: serverTimestamp(),
      });

      // Reset review input and fetch updated reviews
      setNewReview({ rating: 0, comment: '' });
      const reviewsSnap = await getDocs(reviewRef);
      const updatedReviews = reviewsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviews(updatedReviews);

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="restaurant-details">
      {restaurant ? (
        <>
          <CartIcon />
          <h2>{restaurant.name}</h2>
          <button onClick={GoBack}>Go Back</button>
          <p>{restaurant.location}</p>
          <p>Rating: {restaurant.rating}</p>
          <div className="menu">
            <h3>Menu</h3>
            {restaurant.menu?.map((item, index) => (
              <div key={index} className="menu-item">
                <img src={item.image} alt={item.name} className="menu-item-image" />
                <div className="menu-item-info">
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                  <p>${item.price}</p>
                  <input
                    type="number"
                    min="1"
                    defaultValue="1"
                    onChange={(e) => (item.quantity = parseInt(e.target.value))}
                    className="quantity-input"
                  />
                  <button onClick={() => handleAddToCart(item, item.quantity)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="reviews-section">
            <h3>Reviews</h3>
            <ul>
              {reviews.map((review) => (
                <li key={review.id} className="review">
                  <p><strong>Rating:</strong> {review.rating}/5</p>
                  <p>{review.comment}</p>
                </li>
              ))}
            </ul>
            <h4>Leave a Review</h4>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <label>
                Rating:
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newReview.rating}
                  onChange={(e) =>
                    setNewReview({ ...newReview, rating: parseInt(e.target.value) })
                  }
                  required
                />
              </label>
              <label>
                Comment:
                <textarea
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  required
                />
              </label>
              <button type="submit">Submit Review</button>
            </form>
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );  
}

export default RestaurantDetails;
