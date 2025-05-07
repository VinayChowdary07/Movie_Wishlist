import React, { useEffect, useState } from "react";
import Auth from "./auth/Auth.jsx";
import MovieList from "./components/MovieList.jsx";
import { auth } from "./firebase/config.jsx";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-dark">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="border border-danger border-4 rounded-circle"
          style={{
            width: "60px",
            height: "60px",
            borderTop: "4px solid transparent",
          }}
        ></motion.div>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white min-vh-100 d-flex flex-column align-items-center p-4 position-relative">
      <h1 className="display-4 fw-bold text-danger mb-4 text-center">
        🎬 MoviePicker
      </h1>

      {!user ? (
        <Auth />
      ) : (
        <div className="w-100 text-center" style={{ maxWidth: "1100px" }}>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h4 mb-3"
          >
            Welcome, {user.displayName || "User"}!
          </motion.h2>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => signOut(auth)}
            className="btn btn-danger position-absolute top-0 end-0 m-3 shadow"
          >
            🔓 Sign Out
          </motion.button>

          <div className="mt-4">
            <MovieList />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
