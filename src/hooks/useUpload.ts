import { useContext } from "react";
import { ImageProcessingContext } from "../features/image_processing/components/image_processing_context/image_processing_provider";

function useUpload() {
    const {setSrc} = useContext(ImageProcessingContext);

    function handleUpload(e : React.ChangeEvent<HTMLInputElement>) {
        if(e.target.files && e.target.files.length > 0) {
            const url = URL.createObjectURL(e.target.files[0]);
            setSrc(url);    
        } 
    }
    return {handleUpload}
}

export default useUpload;