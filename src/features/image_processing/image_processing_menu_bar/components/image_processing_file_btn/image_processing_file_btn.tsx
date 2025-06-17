import { useRef, useState } from "react";
import useUpload from "../../../../../hooks/useUpload";


import { useHotkeys } from 'react-hotkeys-hook';
import baseStyles from '../image_processing_menu_btns_base.module.css';
import { useDropdownExit } from "../../hooks/useDropdownExit";
import useExport from "./hooks/useExport";
// import styles from "./image_processing_file_btn.module.css";
const ImageProcessingFileBtn = () => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null)
    const [openDropdown, setOpenDropdown] = useState<boolean>(false);

    useHotkeys('ctrl+o', event =>{
        event.preventDefault();
        handleOpen();
    })

    function handleDropdownClick () {
        setOpenDropdown(prev => !prev);
    }

    function handleOpen() :void {
        if(! fileRef || ! fileRef.current) return;
        fileRef.current.click();
    }

    const {handleUpload, fileNameRef} = useUpload();
    const {handleExport} = useExport(fileNameRef.current);

    const fileOptions = [
        {option : 'Open...', handler : handleOpen, shortcut : "Ctrl + O"},
        {option : 'Export', handler : handleExport, shortcut : ""},
    ]

    useDropdownExit(dropdownRef, () => setOpenDropdown(false));

    return (
        <div ref={dropdownRef} className={`${baseStyles.btn_container}`}>
        <button onClick={() => handleDropdownClick()} className={`${baseStyles.button} ${openDropdown ? baseStyles.active : baseStyles.inactive}`}>File</button>
        <ul className={`${baseStyles.dropdown} ${openDropdown ? baseStyles.visible : baseStyles.hidden}` }>
            {fileOptions.map(({option, handler, shortcut}) => (
                <li key={option} onClick={() =>{ handler(); handleDropdownClick()}}> 
                    <span className={`${baseStyles.label}`}>{option}</span>
                    <span className={`${baseStyles.shortcut}`}>{shortcut}</span>
                </li>
            ))}
        </ul>
        <input onChange={(e : React.ChangeEvent<HTMLInputElement>) => handleUpload(e)} ref ={fileRef}type="file" id="fileInput" accept="image/*" style={{display: 'none'}}/>
        </div>
    )
}

export default ImageProcessingFileBtn;