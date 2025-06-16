import { useRef, useState } from 'react';
import { useDropdownExit } from '../../hooks/useDropdownExit';

import baseStyles from '../image_processing_menu_btns_base.module.css';
// import styles from './image_processing_view_btn.module.css';

import useGlobalViewShortcuts from './hooks/useGlobalViewShortcuts';
function ImageProcessingViewBtn  ()  {
    const {handleZoomIn, handleZoomOut, handleFitAreaClick} = useGlobalViewShortcuts(); 
    
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    
    const handleDropdownClick = () => {
        setOpenDropdown(prev => !prev);
    }

    const viewOptions = [
        {option : "Fit The Area", handler : handleFitAreaClick, shortcut : "Ctrl + 0"},
        {option : "Zoom In", handler : handleZoomIn, shortcut : "Ctrl + +"},
        {option : "Zoom Out", handler : handleZoomOut, shortcut : "Ctrl + -" },
    ];

    useDropdownExit(dropdownRef, () => setOpenDropdown(false));

    return (
        <div ref={dropdownRef} className={`${baseStyles.btn_container}`}>
            <button  onClick={handleDropdownClick} className={`${baseStyles.button} ${openDropdown ? baseStyles.active : baseStyles.inactive}`}>View</button>
            <ul className={`${baseStyles.dropdown} ${openDropdown ? baseStyles.visible : baseStyles.hidden}`}>
                {viewOptions.map(({option, handler, shortcut}) => (
                    <li key={option} onClick={() => {handler(); handleDropdownClick()}}> 
                    <span className={`${baseStyles.label}`}>{option}</span>
                    <span className={`${baseStyles.shortcut}`}>{shortcut}</span>
                </li>
                ))}
            </ul>
        </div>
    )
}

export default ImageProcessingViewBtn;