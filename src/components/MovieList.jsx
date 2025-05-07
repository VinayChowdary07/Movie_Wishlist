import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db, auth } from "../firebase/config.jsx";
import { fetchTrailer } from "../utils/youtubeApi.jsx";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { motion } from "framer-motion";

const API_KEY = "8756c43a";

const MovieList = () => {
  const [movie, setMovie] = useState("");
  const [year, setYear] = useState("");
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [picked, setPicked] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [expandedMovieId, setExpandedMovieId] = useState(null);
  const trailerRef = useRef(null);
  const user = auth.currentUser;

  const handleTrailer = async (title) => {
    const url = await fetchTrailer(title);
    if (url) {
      setTrailerUrl(url);
      setTimeout(() => {
        trailerRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      alert("Trailer not found.");
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "movies"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const grouped = {};
      movies.forEach((movie) => {
        const cat = movie.category || "Others";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(movie);
      });

      setMoviesByCategory(grouped);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchMovieDetails = async (title, yearInput) => {
    try {
      const url = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}${
        yearInput ? `&y=${yearInput}` : ""
      }&apikey=${API_KEY}`;
      const res = await axios.get(url);
      if (res.data.Response === "True") {
        return {
          name: res.data.Title,
          poster:
            res.data.Poster && res.data.Poster !== "N/A" ? res.data.Poster : null,
          category: res.data.Genre?.split(",")[0].trim() || "Others",
          plot: res.data.Plot || "Plot not available",
          actors: res.data.Actors || "Cast not available",
          website: res.data.Website || "Not available",
        };
      }
    } catch (error) {
      console.error("OMDb Error:", error);
    }
    return null;
  };

  const handleAddMovie = async () => {
    if (!movie.trim()) return;
    const details = await fetchMovieDetails(movie, year);
    if (details) {
      await addDoc(collection(db, "movies"), {
        name: details.name,
        poster: details.poster,
        category: details.category,
        uid: user.uid,
        createdAt: new Date(),
        plot: details.plot,
        actors: details.actors,
        website: details.website,
      });
      setMovie("");
      setYear("");
    } else {
      alert("Movie not found.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddMovie();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "movies", id));
  };

  const handlePick = () => {
    const allMovies = Object.values(moviesByCategory).flat();
    if (allMovies.length === 0) return setPicked("No movies in list");
    const random = allMovies[Math.floor(Math.random() * allMovies.length)];
    setPicked(random.name);
  };

  const toggleExpand = (id) => {
    setExpandedMovieId(expandedMovieId === id ? null : id);
  };

  return (
    <div className="container my-4 text-white">
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input
            value={movie}
            onChange={(e) => setMovie(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter movie name"
            className="form-control bg-light text-black"
          />
        </div>
        <div className="col-md-4">
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Year (optional)"
            className="form-control bg-light text-black"
          />
        </div>
        <div className="col-md-3">
          <button className="btn btn-danger w-100" onClick={handleAddMovie}>
            ➕ Add
          </button>
        </div>
      </div>

      {Object.keys(moviesByCategory).map((category) => (
        <div key={category} className="mb-5">
          <h4 className="mb-3">{category}</h4>
          <div className="d-flex flex-wrap justify-content-start">
            {moviesByCategory[category].map((m) => (
              <div
                key={m.id}
                className="card bg-dark text-white me-3 mb-3"
                style={{ minWidth: "160px", maxWidth: "200px", flex: "0 0 auto" }}
              >
                {m.poster ? (
                  <img
                    src={m.poster}
                    alt={m.name}
                    className="card-img-top"
                    style={{ height: "220px", objectFit: "cover" }}
                    onClick={() => toggleExpand(m.id)}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: "220px", background: "#444" }}
                    onClick={() => toggleExpand(m.id)}
                  >
                    No Poster
                  </div>
                )}
                <div className="card-body p-2">
                  <h6 className="card-title mb-2" style={{ fontSize: "0.9rem" }}>
                    {m.name}
                  </h6>
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(m.id)}
                    >
                      ❌
                    </button>
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => handleTrailer(m.name)}
                    >
                      ▶ Trailer
                    </button>
                  </div>

                  {expandedMovieId === m.id && (
                    <div className="mt-3">
                      <p><strong>Plot:</strong> {m.plot}</p>
                      <p><strong>Cast:</strong> {m.actors}</p>
                      <p>
  <strong>Available on:</strong>{" "}
  {m.website && m.website !== "N/A" && m.website !== "Not available" ? (
    <a
      href={m.website}
      target="_blank"
      rel="noopener noreferrer"
      className="text-info"
    >
      Watch here
    </a>
  ) : (
    "Not available"
  )}
</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center mt-4">
        <button className="btn btn-danger btn-lg" onClick={handlePick}>
          🎲 Pick Random Movie
        </button>
      </div>

      {picked && (
        <motion.p
          key={picked}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center mt-3 fs-5 text-success"
        >
          🎬 You should watch: <strong>{picked}</strong>
        </motion.p>
      )}

      {trailerUrl && (
        <div ref={trailerRef} className="mt-4 text-center">
          <iframe
            width="560"
            height="315"
            src={trailerUrl}
            title="YouTube Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default MovieList;
