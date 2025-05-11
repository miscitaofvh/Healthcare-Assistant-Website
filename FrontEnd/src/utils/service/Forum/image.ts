import InteractImage from "../../../utils/api/Forum/image";

const uploadPostImageFE = async (
    formData: FormData
): Promise<string> => { 
    try {
        const response = await InteractImage.uploadImage(formData);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message || 'Failed to upload image');
        }
        let markdownImage = '';
        if(data && data.imageUrl){
            markdownImage = `![image](${data.imageUrl})`;
        }

        return markdownImage;
    } catch (err: unknown) {
        let errorMessage = 'Failed to upload image';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        throw new Error(errorMessage);
    }
}
export default {
    uploadPostImageFE
};