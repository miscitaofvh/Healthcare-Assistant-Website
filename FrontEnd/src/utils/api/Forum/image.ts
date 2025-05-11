import { requestAPIFormdata } from "../request";
const BASE_URL = "http://localhost:5000/api/forum";

async function uploadImage(formData: FormData) {
    const response = await requestAPIFormdata(BASE_URL, `/upload-image`, "POST", formData);
    return response;
}

export default {
    uploadImage
};

