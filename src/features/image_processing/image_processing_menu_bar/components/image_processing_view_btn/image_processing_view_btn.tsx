import { useContext, useRef, useState } from 'react';
import styles from './image_processing_view_btn.module.css';
import { useDropdownExit } from '../../hooks/useDropdownExit';
import { ImageProcessingContext } from '../../../components/image_processing_context/image_processing_provider';
const ImageProcessingViewBtn = () => {
    const dropdownRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState<boolean>(false)
    // const {glCanvasRef, src, rendererRef} = useContext(ImageProcessingContext);}
    const handleClick = () => {
        setOpen(prev => !prev);
    }

    useDropdownExit(dropdownRef, () => setOpen(false));

    return (
        <div className={`${styles.view_btn_container}`}>
            <button ref={dropdownRef} onClick={handleClick} className={`${styles.view_btn}`}>View</button>
            <ul className={`${styles.view_btn_dropdown} ${open ? styles.visible : styles.hidden}`}>
                <li>Zoom In</li>
                <li>Zoom Out</li>
                <li>Fit to Area</li>
            </ul>
        </div>
    )
}

export default ImageProcessingViewBtn;