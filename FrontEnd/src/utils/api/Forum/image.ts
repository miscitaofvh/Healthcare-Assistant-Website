import { requestAPIFormdata } from "../request";
import { getApiUrl } from '../../../config/env';

const BASE_URL = getApiUrl('/forum');

async function uploadImage(formData: FormData) {
    const response = await requestAPIFormdata(BASE_URL, `/upload-image`, "POST", formData);
    return response;
}

export default {
    uploadImage
};