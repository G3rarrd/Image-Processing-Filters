import { useRef, useState } from 'react';
import styles from './image_processing_filter_btn.module.css';
import useGrayscale from './hooks/useGrayscale';
import useInvert from './hooks/useInvert';
import useSobel from './hooks/useSobel';
import useSharpen from './hooks/useSharpen';
import useEmboss from './hooks/useEmboss';
// import { useHotkeys } from 'react-hotkeys-hook';
import useQuantization from './hooks/useQuantization';
import useDithering from './hooks/useDithering';
import useBinaryThreshold from './hooks/useBinaryThreshold';
import usePixelize from './hooks/usePixelize';
import useGaussianBlur from './hooks/useGaussianBlur';
import useXDoG from './hooks/useXDoG';

const ImageProcessingFilterBtn = () => {
    const dropdownRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState<boolean>(false);

    // useHotkeys('ctrl+z', () => {
    //     if (! rendererRef || ! rendererRef.current) return;
    //     rendererRef.current.historyStack.undo();
    //     rendererRef.current.renderScene();
    // })

    const {handleGrayscale} = useGrayscale();
    const {handleInvert} = useInvert();
    const {handleSobel} = useSobel();
    const {handleSharpen} = useSharpen();
    const {handleEmbossClick} = useEmboss();
    const {handleQuantizationClick} = useQuantization();
    const {handleDithering} = useDithering();
    const {handleBinaryThresholdClick} = useBinaryThreshold();
    const {handlePixelizeClick} = usePixelize();
    const {handleGaussianBlurClick} = useGaussianBlur();
    const {handleXDoGClick} = useXDoG();

    function handleClick () {
        setOpen(prev => !prev);
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
                <li onClick={handleEmbossClick}>Emboss</li>
                <li onClick={handleQuantizationClick}>Quantization</li>
                <li onClick={handleDithering}>Dithering</li>
                <li onClick={handleBinaryThresholdClick}>Binary Threshold</li>
                <li onClick={handlePixelizeClick}>Pixelize</li>
                <li onClick={handleGaussianBlurClick}>Gaussian Blur</li>
                <li onClick={handleXDoGClick}>XDoG</li>
            </ul>
        </div>
    )
}

export default ImageProcessingFilterBtn;