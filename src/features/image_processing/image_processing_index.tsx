import { ImageProcessingProvider } from "./components/image_processing_context/image_processing_provider";
import ImageProcessingPageLayout from "../../layouts/image_processing_layout/image_processing_page_layout";

import ImageUploadArea from './components/image_processing_upload/components/image_processing_upload_area/image_processing_upload_area';

import './image_processing_index.css'
import ImageProcessingMenuBar from "./image_processing_menu_bar/components/image_processing_menu_bar";
const ImageProcessingIndex = () => {
    return (
        <>
            <ImageProcessingPageLayout>
                <ImageProcessingProvider>
                    <ImageProcessingMenuBar/>
                    <div className="image_processing_area">
                            <ImageUploadArea />
                    </div>

                </ImageProcessingProvider>
            </ImageProcessingPageLayout>
        </>
    )
}

export default ImageProcessingIndex;