import { useRef, useState } from 'react';
import { useDropdownExit } from '../../hooks/useDropdownExit';
import useFitArea from './hooks/useFitArea';
import useZoomIn from './hooks/useZoomIn';
import useZoomOut from './hooks/useZoomOut';

import baseStyles from '../image_processing_menu_btns_base.module.css';
// import styles from './image_processing_view_btn.module.css';
import { useHotkeys } from 'react-hotkeys-hook';
const ImageProcessingViewBtn = () => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    
    useHotkeys('ctrl+0', event =>{
        handleFitAreaClick();
    })

    const handleDropdownClick = () => {
        setOpenDropdown(prev => !prev);
    }

    const {handleFitAreaClick} = useFitArea();
    const {handleZoomIn} = useZoomIn();
    const {handleZoomOut} = useZoomOut();

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