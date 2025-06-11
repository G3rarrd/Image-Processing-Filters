import { useContext, useRef, useState } from 'react';
import styles from './image_processing_filter_btn.module.css';
import useGrayscale from './hooks/useGrayscale';
import useInvert from './hooks/useInvert';
import useSobel from './hooks/useSobel';
import useSharpen from './hooks/useSharpen';
import useEmboss from './hooks/useEmboss';
import { useHotkeys } from 'react-hotkeys-hook';
import useQuantization from './hooks/useQuantization';
import useDithering from './hooks/useDithering';
import useBinaryThreshold from './hooks/useBinaryThreshold';
import usePixelize from './hooks/usePixelize';
import useGaussianBlur from './hooks/useGaussianBlur';
import useXDoG from './hooks/useXDoG';
import useFDoG from './hooks/useFDoG';
import useFBL from './hooks/useFBL';
import { ImageProcessingContext } from '../../../components/image_processing_context/image_processing_provider';
import { useDropdownExit } from '../../hooks/useDropdownExit';

const ImageProcessingFilterBtn = () => {
    const {rendererRef} = useContext(ImageProcessingContext);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [openDropdown, setOpenDropdown] = useState<boolean>(false);

    useHotkeys('ctrl+z', () => {
        if (! rendererRef || ! rendererRef.current) return;
        rendererRef.current.holdCurrentTexture = rendererRef.current.historyStack.undo();
        rendererRef.current.currentTexture = rendererRef.current.holdCurrentTexture;
        rendererRef.current.renderScene();
    });

    useHotkeys('ctrl+y', () => {
        if (! rendererRef || ! rendererRef.current) return;
        rendererRef.current.holdCurrentTexture = rendererRef.current.historyStack.redo();
        rendererRef.current.currentTexture = rendererRef.current.holdCurrentTexture;
        rendererRef.current.renderScene();
    });

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
    const {handleFDoGClick} = useFDoG();
    const {handleFBLClick} = useFBL();

    const filterOptions = [
        { filter: 'Grayscale', handler: handleGrayscale },
        { filter: 'Invert', handler: handleInvert },
        { filter: 'Sobel', handler: handleSobel },
        { filter: 'Sharpen', handler: handleSharpen },
        { filter: 'Emboss', handler: handleEmbossClick },
        { filter: 'Quantization', handler: handleQuantizationClick },
        { filter: 'Dithering', handler: handleDithering },
        { filter: 'Binary Threshold', handler: handleBinaryThresholdClick },
        { filter: 'Pixelize', handler: handlePixelizeClick },
        { filter: 'Gaussian Blur', handler: handleGaussianBlurClick },
        { filter: 'XDoG', handler: handleXDoGClick },
        { filter: 'FDoG', handler: handleFDoGClick },
        { filter: 'FBL', handler: handleFBLClick },
    ];

    function handleClick () {
        setOpenDropdown(prev => !prev);
    }

    useDropdownExit(dropdownRef, () => setOpenDropdown(false));
    

    return (
        <div ref={dropdownRef} className={`${styles.filter_btn_container}`}>
            <button  onClick={handleClick} className={`${styles.filter_btn}`}>Filter</button>
            <ul className={`${styles.filter_btn_dropdown} ${openDropdown ? styles.visible : styles.hidden}`}>
                {filterOptions.map(({filter, handler}) => (
                    <li key={filter} onClick={() => {handler(); handleClick()}}>{filter}</li>
                ))}
            </ul>
        </div>
    )
}

export default ImageProcessingFilterBtn;