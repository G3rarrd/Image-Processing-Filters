import { useRef, useState } from 'react';
import styles from './image_processing_view_btn.module.css';
import { useDropdownExit } from '../../hooks/useDropdownExit';
import useFitArea from './hooks/useFitArea';
import useZoomIn from './hooks/useZoomIn';
import useZoomOut from './hooks/useZoomOut';
const ImageProcessingViewBtn = () => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpenDropdown] = useState<boolean>(false)
    
    const handleDropdownClick = () => {
        setOpenDropdown(prev => !prev);
    }

    const {handleFitAreaClick} = useFitArea();
    const {handleZoomIn} = useZoomIn();
    const {handleZoomOut} = useZoomOut();

    const viewOptions = [
        {option : "Fit to Area", handler : handleFitAreaClick},
        {option : "Zoom In", handler : handleZoomIn },
        {option : "Zoom Out", handler : handleZoomOut },
    ];

    useDropdownExit(dropdownRef, () => setOpenDropdown(false));

    return (
        <div ref={dropdownRef} className={`${styles.view_btn_container}`}>
            <button  onClick={handleDropdownClick} className={`${styles.view_btn}`}>View</button>
            <ul className={`${styles.view_btn_dropdown} ${open ? styles.visible : styles.hidden}`}>
                {viewOptions.map(({option, handler}) => (
                    <li key={option} onClick={() => {handler(); handleDropdownClick()}}>{option}</li>
                ))}
            </ul>
        </div>
    )
}

export default ImageProcessingViewBtn;