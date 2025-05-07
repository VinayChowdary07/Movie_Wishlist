// src/utils/youtubeApi.js
import axios from "axios";

const YOUTUBE_API_KEY = "AIzaSyCgU26cX3RJOZazz88vKH-fLKK9p_daUiI";

export const fetchTrailer = async (movieTitle) => {
  const query = `${movieTitle} official trailer`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`;

  try {
    const res = await axios.get(url);
    const video = res.data.items[0];
    return `https://www.youtube.com/embed/${video.id.videoId}`;
  } catch (err) {
    console.error("YouTube API error:", err);
    return null;
  }
};
