import { useContext, useRef } from "react";
import { ImageProcessingContext } from "../features/image_processing/components/image_processing_context/image_processing_provider";

function useUpload() {
    const {setSrc} = useContext(ImageProcessingContext);
    const fileNameRef = useRef<string>('');

    function handleUpload(e : React.ChangeEvent<HTMLInputElement>) {
        if(e.target.files && e.target.files.length > 0) {
            const file : File = e.target.files[0];
            fileNameRef.current = file.name;
            const url = URL.createObjectURL(file);
            setSrc(url);    
        } 
    }

    return {handleUpload, fileNameRef};
}

export default useUpload;