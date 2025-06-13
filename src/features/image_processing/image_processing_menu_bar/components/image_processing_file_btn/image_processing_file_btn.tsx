import { useRef, useState } from "react";
import styles from "./image_processing_file_btn.module.css";
import useUpload from "../../../../../hooks/useUpload";

const ImageProcessingFileBtn = () => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null)
    const [openDropdown, setOpenDropdown] = useState<boolean>(false);



    function handleDropdown () {
        setOpenDropdown(prev => !prev);
    }

    function handleOpen() :void {
        if(! fileRef || ! fileRef.current) return;
        fileRef.current.click();
    }
    const {handleUpload} = useUpload();


    const fileOptions = [
        {option : 'Open...', handler : handleOpen},
    ]

    return (
        <div ref={dropdownRef} className={`${styles.file_btn_container}`}>
        <button onClick={() => handleDropdown()} className={`${styles.file_btn}`}>File</button>
        <ul className={`${styles.file_btn_dropdown} ${openDropdown ? styles.visible : styles.hidden}` }>
            {fileOptions.map(({option, handler}) => (
                <li key={option} onClick={() => handler()}>{option}</li>
            ))}
        </ul>
        <input onChange={(e : React.ChangeEvent<HTMLInputElement>) => handleUpload(e)} ref ={fileRef}type="file" id="fileInput" accept="image/*" style={{display: 'none'}}/>
        </div>
    )
}

export default ImageProcessingFileBtn;