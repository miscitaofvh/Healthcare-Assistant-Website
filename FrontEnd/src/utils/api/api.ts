import axios from 'axios';
const API_URL = "http://localhost:5000";
const API = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // ✅ Allows sending HTTP-only cookies
});

export default API;
