import { useContext, useRef, useState } from 'react';
import useGrayscale from './hooks/useGrayscale';
import useInvert from './hooks/useInvert';
import useSobel from './hooks/useSobel';
import useSharpen from './hooks/useSharpen';
import useEmboss from './hooks/useEmboss';
import useQuantization from './hooks/useQuantization';
import useDithering from './hooks/useDithering';
import useBinaryThreshold from './hooks/useBinaryThreshold';
import usePixelize from './hooks/usePixelize';
import useGaussianBlur from './hooks/useGaussianBlur';
import useXDoG from './hooks/useXDoG';
import useCoherentLineDrawing from './hooks/useCoherentLineDrawing';
import useFBL from './hooks/useFBL';
import { ImageProcessingContext } from '../../../components/image_processing_context/image_processing_provider';
import { useDropdownExit } from '../../hooks/useDropdownExit';
import useKuwahara from './hooks/useKuwahara';
import useGeneralizedKuwahara from './hooks/useGeneralizedKuwahara';
import useAnisotropicKuwahara from './hooks/useAnisotropicKuwahara';


import { useHotkeys } from 'react-hotkeys-hook';
import baseStyles from '../image_processing_menu_btns_base.module.css';
// import styles from './image_processing_filter_btn.module.css';
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

    useHotkeys('ctrl+shift+z', () => {
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
    const {handleFDoGClick} = useCoherentLineDrawing();
    const {handleFBLClick} = useFBL();
    const {handleKuwaharaClick} = useKuwahara();
    const {handleGeneralizedKuwaharaClick} = useGeneralizedKuwahara();
    const {handleAnisotropicKuwaharaClick} = useAnisotropicKuwahara();

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
        { filter: 'Coherent Line Drawing', handler: handleFDoGClick },
        { filter: 'FBL', handler: handleFBLClick },
        { filter: 'Kuwahara', handler: handleKuwaharaClick},
        { filter: 'Generalized Kuwahara', handler: handleGeneralizedKuwaharaClick},
        { filter: 'Anisotropic Kuwahara', handler: handleAnisotropicKuwaharaClick},
    ];

    function handleDropdownClick () {
        setOpenDropdown(prev => !prev);
    }

    useDropdownExit(dropdownRef, () => setOpenDropdown(false));
    

    return (
        <div ref={dropdownRef} className={`${baseStyles.btn_container}`}>
            <button  onClick={handleDropdownClick} className={`${baseStyles.button} ${openDropdown ? baseStyles.active : baseStyles.inactive}`}>Filter</button>
            <ul className={`${baseStyles.dropdown} ${openDropdown ? baseStyles.visible : baseStyles.hidden}`}>
                {filterOptions.map(({filter, handler}) => (
                    <li key={filter} onClick={() => {handler();handleDropdownClick()}}>{filter}</li>
                ))}
            </ul>
        </div>
    )
}

export default ImageProcessingFilterBtn;