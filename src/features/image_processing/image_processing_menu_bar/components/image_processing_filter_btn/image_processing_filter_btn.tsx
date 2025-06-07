import { useRef, useState } from 'react';
import styles from './image_processing_filter_btn.module.css';
import useGrayscale from './hooks/useGrayscale';
import useInvert from './hooks/useInvert';
import useSobel from './hooks/useSobel';
import useSharpen from './hooks/useSharpen';
import useEmboss from './hooks/useEmboss';

const ImageProcessingFilterBtn = () => {
    const dropdownRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState<boolean>(false);

    const {handleGrayscale} = useGrayscale();
    const {handleInvert} = useInvert();
    const {handleSobel} = useSobel();
    const {handleSharpen} = useSharpen();
    const {handleEmboss} = useEmboss();

    function handleClick () {
        setOpen(prev => !prev )
    }
    // useDropdownExit(dropdownRef, () => setOpen(false));

    return (
        <div className={`${styles.filter_btn_container}`}>
            <button ref={dropdownRef} onClick={handleClick} className={`${styles.filter_btn}`}>Filter</button>
            <ul className={`${styles.filter_btn_dropdown} ${open ? styles.visible : styles.hidden}`}>
                <li onClick={handleGrayscale}>Grayscale</li>
                <li onClick={handleInvert}>Invert</li>
                <li onClick={handleSobel}>Sobel</li>
                <li onClick={handleSharpen}>Sharpen</li>
                <li onClick={handleEmboss}>Emboss</li>
            </ul>
        </div>
    )
}

export default ImageProcessingFilterBtn;