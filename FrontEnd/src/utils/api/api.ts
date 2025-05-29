import axios from 'axios';
import { config } from '../../config/env';

const API = axios.create({
    baseURL: `${config.API_URL}${config.API_BASE_PATH}`,
    withCredentials: true, // ✅ Allows sending HTTP-only cookies
});

export default API;
