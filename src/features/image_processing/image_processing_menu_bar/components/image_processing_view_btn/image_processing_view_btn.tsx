import { useContext, useRef, useState } from 'react';
import styles from './image_processing_view_btn.module.css';
import { useDropdownExit } from '../../hooks/useDropdownExit';
import { ImageProcessingContext } from '../../../components/image_processing_context/image_processing_provider';
import useFitArea from './hooks/useFitArea';
const ImageProcessingViewBtn = () => {
    const {glCanvasRef, src, rendererRef} = useContext(ImageProcessingContext);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpenDropdown] = useState<boolean>(false)
    
    const handleDropdownClick = () => {
        setOpenDropdown(prev => !prev);
    }

    const {handleFitAreaClick} = useFitArea();

    const viewOptions = [
        {option : "Fit to Area", handler : handleFitAreaClick}
        
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