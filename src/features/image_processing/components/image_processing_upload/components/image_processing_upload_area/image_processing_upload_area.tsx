import React, { useContext, useRef, useState } from "react";
import { ImageProcessingContext } from "../../../image_processing_context/image_processing_provider";
import ImageProcessingCanvas from "../../../../image_processing_canvas/image_processing_canvas";
import ImageUploadBtn from "../../../image_upload_btn/image_upload_btn";
import ImageDownloadBtn from "../../../image_download_btn/image_download_btn";
import './image_processing_upload_area.css';

const ImageUploadArea = () => {
    const {src, imageError, setSrc, handleImageUpload} = useContext(ImageProcessingContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const imgIconSrc = "src/assets/—Pngtree—vector picture icon_4013555.png";


    const handleClick = () : void => {
        fileInputRef.current?.click();
    }
    
    if (imageError) {
        return (
            <p>
                ERROR!!!
            </p>
        )
    }

    if (!src) {
        return (
            <>
            <div className="image_upload_div"onClick={handleClick} > 
                <img className="imgIcon" src={imgIconSrc} alt="imgIcon"/>
                <p>Drop an image to edit or <button className='browseBtn'>browse</button></p>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                style={{display: 'none'}} 
                accept="image/*"
            />
        </>
        )
    }

    return (
        <>
        <div className='image_processing_container'>
            <div className="uploaded_img_div"onClick={handleClick} > 
                <ImageProcessingCanvas/>
            </div>

            {/* <div className="upload_downLoad_btn_area">
                <ImageUploadBtn/>
                <ImageDownloadBtn/>
            </div> */}
        </div>
        
        </>

        
    )
}

export default ImageUploadArea;