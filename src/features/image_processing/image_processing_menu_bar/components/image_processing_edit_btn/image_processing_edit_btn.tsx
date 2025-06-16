import { useRef, useState } from "react";

import baseStyles from '../image_processing_menu_btns_base.module.css';
import useEditShortcuts from "./hooks/useEditShortCuts";
import { useDropdownExit } from "../../hooks/useDropdownExit";
function ImageProcessingEditBtn () {
    const {handleRedo, handleUndo} = useEditShortcuts(); 
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [openDropdown, setOpenDropdown] = useState<boolean>(false);

    function handleDropdownClick () {
        setOpenDropdown(prev => !prev);
    }

    const editOptions = [
        {option : 'Undo', handler : handleUndo, shortcut : "Ctrl + Z"},
        {option : 'Redo', handler : handleRedo, shortcut : "Ctrl + Shift + Z"},
    ]

    useDropdownExit(dropdownRef, () => setOpenDropdown(false));

    return (
    <div ref ={dropdownRef} className={`${baseStyles.btn_container}`}>
        <button  onClick={handleDropdownClick} className={`${baseStyles.button} ${openDropdown ? baseStyles.active : baseStyles.inactive}`}>Edit</button>
        <ul className={`${baseStyles.dropdown} ${openDropdown ? baseStyles.visible : baseStyles.hidden}` }>
            {editOptions.map(({option, handler, shortcut}) => (
                <li key={option} onClick={() =>{ handler(); handleDropdownClick()}}> 
                    <span className={`${baseStyles.label}`}>{option}</span>
                    <span className={`${baseStyles.shortcut}`}>{shortcut}</span>
                </li>
            ))}
        </ul>
    </div>
    )
}

export default ImageProcessingEditBtn;