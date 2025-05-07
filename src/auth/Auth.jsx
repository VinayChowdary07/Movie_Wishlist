// src/auth/Auth.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

const Auth = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null); // To store any error

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return unsubscribe; // Clean up the listener
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setError("Failed to sign in. Please try again.");
    }
  };

  const logout = () => {
    signOut(auth).then(() => {
      setUser(null);
    }).catch((err) => {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
    });
  };

  return (
    <div
      style={{
        color: "#fff",
        minHeight: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "2rem",
      }}
    >
      {error && (
        <p
          style={{
            color: "red",
            fontSize: "1rem",
            marginBottom: "1rem",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
      {!user ? (
        <button
          onClick={loginWithGoogle}
          style={{
            backgroundColor: "#E50914",
            color: "#fff",
            border: "none",
            padding: "1rem 2rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            borderRadius: "50px",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            width: "200px", // Limit the width of the button
            marginTop: "2rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          Sign in with Google
        </button>
      ) : (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#fff",
              marginBottom: "1rem",
              textShadow: "1px 1px 5px rgba(0, 0, 0, 0.4)",
            }}
          >
            Welcome, <span style={{ color: "#E50914" }}>{user.displayName}</span>!
          </p>
          <button
            onClick={logout}
            style={{
              backgroundColor: "#E50914",
              color: "#fff",
              border: "none",
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
              width: "200px", // Limit the width of the button
              marginTop: "1rem",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default Auth;
