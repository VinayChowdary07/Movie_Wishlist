import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db, auth } from "../firebase/config.jsx";
import { fetchTrailer } from "../utils/youtubeApi.jsx";
import {
  collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const API_KEY = "8756c43a";

const categoryColors = {
  Action: "border-danger",
  Comedy: "border-warning",
  Drama: "border-primary",
  Horror: "border-dark",
  Romance: "border-pink",
  SciFi: "border-info",
  Others: "border-secondary",
};

const moviesPerPage = 5; // 👈 Showing 5 movies per page

const MovieList = () => {
  const [movie, setMovie] = useState("");
  const [year, setYear] = useState("");
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [allFilteredMovies, setAllFilteredMovies] = useState([]);
  const [picked, setPicked] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [expandedMovieId, setExpandedMovieId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("wishlist");
  const [darkMode, setDarkMode] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const movieRefs = useRef({});
  const user = auth.currentUser;
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [minRating, setMinRating] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = allFilteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(allFilteredMovies.length / moviesPerPage);

  const handleTrailer = async (title) => {
    const url = await fetchTrailer(title);
    if (url) {
      setTrailerUrl(url);
      setShowTrailerModal(true);
    } else {
      toast.error("Trailer not found.");
    }
  };

  const filterMovies = (movies) => {
    const filtered = movies.filter((movie) => {
      const matchesSearch = movie.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = !minRating || parseFloat(movie.imdb) >= parseFloat(minRating);
      const matchesGenre =
  genreFilter === "All" ||
  (Array.isArray(movie.genres) && movie.genres.includes(genreFilter));

      return matchesSearch && matchesRating && matchesGenre;
    });
    return filtered;
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "movies"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const filteredStatus = movies.filter((m) => m.status === statusFilter);
      const grouped = {};
      filteredStatus.forEach((movie) => {
        const genres = movie.genres?.length ? movie.genres : ["Others"];
        genres.forEach((genre) => {
          if (!grouped[genre]) grouped[genre] = [];
          grouped[genre].push(movie);
        });

      });
      setMoviesByCategory(grouped);
      setAllFilteredMovies(filterMovies(filteredStatus));
    });
    return () => unsubscribe();
  }, [user, statusFilter, searchTerm, genreFilter, minRating]);

  const normalizeGenresArray = (genreList) => {
    const validCategories = ["Action", "Comedy", "Drama", "Horror", "Romance", "SciFi"];
    const cleanedGenres = genreList.split(",").map((g) => g.trim());

    return cleanedGenres
      .map((genre) => (genre === "Sci-Fi" ? "SciFi" : genre))
      .filter((g) => validCategories.includes(g));
  };


  const fetchMovieDetails = async (title, yearInput) => {
    try {
      const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}${
        yearInput ? `&y=${yearInput}` : ""
      }&apikey=${API_KEY}`;
      const res = await axios.get(url);
      if (res.data.Response === "True") {
        return {
          name: res.data.Title,
          poster: res.data.Poster !== "N/A" ? res.data.Poster : null,
          genres: normalizeGenresArray(res.data.Genre || ""),
          plot: res.data.Plot || "Plot not available",
          actors: res.data.Actors || "Cast not available",
          website: res.data.Website || "Not available",
          imdb: res.data.imdbRating || "N/A",
        };
      }
    } catch (error) {
      console.error("OMDb Error:", error);
    }
    return null;
  };

  const handleAddMovie = async () => {
    if (!movie.trim()) return;
    setLoading(true);
    try {
      const details = await fetchMovieDetails(movie, year);
      if (details) {
        const docRef = await addDoc(collection(db, "movies"), {
          ...details,
          uid: user.uid,
          createdAt: new Date(),
          status: "wishlist",
        });
        setNewlyAddedId(docRef.id);
        setMovie("");
        setYear("");
        toast.success("Movie added!");
      } else {
        toast.error("Movie not found. Please check the title.");
      }
    } catch (err) {
      console.error("Error adding movie:", err);
      toast.error("An error occurred. Try again.");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "movies", id));
    toast.info("Movie deleted.");
  };

  const toggleExpand = (id) => {
    setExpandedMovieId(expandedMovieId === id ? null : id);
  };

  const toggleStatus = async (id, newStatus) => {
    try {
      const movieRef = doc(db, "movies", id);
      await updateDoc(movieRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating movie status:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddMovie();
  };

  const handlePick = () => {
    const allMovies = Object.values(moviesByCategory).flat();
    if (allMovies.length === 0) return setPicked("No movies in list");
    const random = allMovies[Math.floor(Math.random() * allMovies.length)];
    setPicked(random.name);
  };

  const themeClass = darkMode ? "bg-black text-white" : "bg-white text-dark";

  useEffect(() => {
    if (newlyAddedId && movieRefs.current[newlyAddedId]) {
      movieRefs.current[newlyAddedId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setNewlyAddedId(null);
    }
  }, [allFilteredMovies, newlyAddedId]);

  return (
    <div className={`container my-4 ${themeClass}`}>
      <ToastContainer />

      {/* Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <button className={`btn btn-${statusFilter === "wishlist" ? "secondary" : "outline-secondary"} me-2`} onClick={() => setStatusFilter("wishlist")}>🎯 Wishlist</button>
          <button className={`btn btn-${statusFilter === "watched" ? "secondary" : "outline-secondary"}`} onClick={() => setStatusFilter("watched")}>✅ Watched</button>
        </div>
        <button className="btn bg-dark btn-outline-warning" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Search by title" className="form-control" />
        </div>
        <div className="col-md-4">
          <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="form-select">
            <option value="All">All Genres</option>
            {Object.keys(categoryColors).map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <input type="number" value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="⭐ Min IMDb rating" className="form-control" min="0" max="10" step="0.1" />
        </div>
      </div>

      {/* Add Movie */}
      <div className="row g-2 mb-4">
        <div className="col-md-5">
          <input value={movie} onChange={(e) => setMovie(e.target.value)} onKeyDown={handleKeyPress} placeholder="Enter movie name" className="form-control" />
        </div>
        <div className="col-md-4">
          <input value={year} onChange={(e) => setYear(e.target.value)} onKeyDown={handleKeyPress} placeholder="Year (optional)" className="form-control" />
        </div>
        <div className="col-md-3">
          <button className="btn btn-danger w-100" onClick={handleAddMovie}>➕ Add</button>
          {loading && <p className="text-info mt-2">Adding movie...</p>}
        </div>
      </div>

      {/* Movie Cards */}
      <div className="row g-3">
        {currentMovies.map((m) => (
          <div
            key={m.id}
            ref={(el) => (movieRefs.current[m.id] = el)}
            className={`card me-3 mb-3 shadow-sm hover-scale ${categoryColors[m.category] || "border-light"} ${expandedMovieId === m.id ? "scale-up" : ""}`}
            style={{
              minWidth: "160px",
              maxWidth: "200px",
              flex: "0 0 auto",
              background: darkMode ? "#222" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderWidth: "2px",
            }}
            onClick={() => toggleExpand(m.id)}
          >
            {m.poster ? (
              <img src={m.poster} alt={m.name} className="card-img-top" style={{ height: "220px", objectFit: "cover" }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ height: "220px", background: "#444" }}>
                No Poster Available
              </div>
            )}
            <h6 className="text-center bg-dark bg-opacity-75 text-white p-1 m-0">{m.name}</h6>
            <div className="card-body p-2">
              <div className="d-flex justify-content-between mb-2">
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m.id)}>❌</button>
                <button className="btn btn-sm btn-outline-info" onClick={() => handleTrailer(m.name)}>▶</button>
              </div>
              <button className="btn btn-sm btn-outline-success mt-2 w-100" onClick={() => toggleStatus(m.id, statusFilter === "wishlist" ? "watched" : "wishlist")}>
                {statusFilter === "wishlist" ? "✔ Move to Watched" : "🎯 Move to Wishlist"}
              </button>
              {expandedMovieId === m.id && (
                <div className="mt-2">
                  <p><strong>Plot:</strong> {m.plot}</p>
                  <p><strong>Actors:</strong> {m.actors}</p>
                  <p><strong>IMDb Rating:</strong> {m.imdb}</p>
                  <p><strong>Website:</strong> <a href={m.website} target="_blank" rel="noopener noreferrer">{m.website}</a></p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="d-flex justify-content-center mt-4">
        <button className="btn btn-outline-secondary me-2" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          ⬅ Prev
        </button>
        <span className="align-self-center">Page {currentPage} of {totalPages}</span>
        <button className="btn btn-outline-secondary ms-2" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
          Next ➡
        </button>
      </div>

      {/* Random Picker */}
      <div className="text-center my-5">
        <button
          className="btn btn-lg btn-outline-primary px-5 py-3 fw-bold shadow animate__animated animate__pulse"
          onClick={handlePick}
        >
          🎲 Pick a Random Movie
        </button>

        {picked && (
          <div className="d-flex justify-content-center mt-4">
            <div
              className="picked-box animate__animated animate__fadeInDown"
              style={{
                backgroundColor: "#f8f9fa",
                border: "2px solid #0d6efd",
                borderRadius: "12px",
                padding: "1.5rem 2rem",
                fontSize: "1.75rem",
                fontWeight: "600",
                color: "#0d6efd",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                minWidth: "300px",
                maxWidth: "90%",
              }}
            >
              {picked}
            </div>
          </div>
        )}
      </div>


      {/* Trailer Modal */}
      <div className="modal fade show" tabIndex="-1" style={{ display: showTrailerModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.8)' }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div className="modal-content bg-dark text-white">
            <div className="modal-header">
              <h5 className="modal-title">🎬 Trailer</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowTrailerModal(false)}></button>
            </div>
            <div className="modal-body">
              {trailerUrl ? (
                <iframe width="100%" height="500px" src={trailerUrl} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
              ) : (
                <p>No trailer available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieList;
