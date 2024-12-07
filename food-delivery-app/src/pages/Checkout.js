import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentApproved, setPaymentApproved] = useState(false); // Track payment approval status
  const [isProcessing, setIsProcessing] = useState(false); // Track payment processing state

  const restaurantId = location.state?.restaurantId;
  if (!restaurantId) {
    alert("Restaurant ID is missing. Redirecting to dashboard.");
    navigate("/dashboard");
    return null;
  }

  // Calculate the total amount for the cart
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleOrderPlacement = async () => {
    if (!paymentApproved) {
      alert("Please complete your payment before placing the order.");
      return;
    }

    try {
      setIsProcessing(true); // Start order processing
      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id ?? null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: totalAmount,
        createdAt: new Date(),
        status: "pending",
        userId: currentUser?.uid,
        restaurantID: restaurantId,
        usernotificationviewed: false,
      };

      // Save order to Firestore
      await addDoc(collection(db, "orders"), orderData);
      alert("Order placed successfully!");
      clearCart();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false); // Stop order processing
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <p>Total: ${totalAmount.toFixed(2)}</p>

      <PayPalScriptProvider
        options={{
          clientId:
            "ARBjhm4LTjPyHWE5k_-BcosNlZV-0s56jxBPChiP7bFtMmfv17M8O6A-ci-7eycUV5Etf0EGX06ZnWmh",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: totalAmount.toFixed(2), // Send total amount to PayPal
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            try {
              // const details = await actions.order.capture(); // Finalize the PayPal payment
              setPaymentApproved(true); // Mark payment as approved
              alert("Payment successful! You can now place your order.");
            } catch (error) {
              console.error("Error capturing PayPal payment:", error);
              alert("Failed to process payment. Please try again.");
            }
          }}
          onError={(error) => {
            console.error("PayPal error:", error);
            alert("There was an issue with the PayPal payment process.");
          }}
        />
      </PayPalScriptProvider>

      <button
        onClick={handleOrderPlacement}
        disabled={!paymentApproved || isProcessing} // Only enable after successful payment
      >
        {isProcessing ? "Processing Order..." : "Place Order"}
      </button>
    </div>
  );
}

export default Checkout;
