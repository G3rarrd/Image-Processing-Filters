import { createContext, useState, ReactNode, useRef} from 'react';
import { ImageProcessingContextProps, defaultValue } from './image_processing_context';
import WebGLRenderer from '../../../../utils/Scene/webGLRender';
import { RangeSlidersProps } from '../../../../types/slider';

export const ImageProcessingContext : React.Context<ImageProcessingContextProps> = createContext<ImageProcessingContextProps>(defaultValue);

export const ImageProcessingProvider : React.FC<{children : ReactNode}> = ({children}) => {
    const [src, setSrc] = useState<string | undefined>(defaultValue.src);
    const [openFilterControl,setOpenFilterControl] = useState<boolean>(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [sliderConfigs, setSliderConfigs] = useState<RangeSlidersProps[]>([]);
    const [filterName, setFilterName] = useState<string>('');

    const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    
    const filterFuncRef = useRef<(configs: RangeSlidersProps[]) => void>(() => {});


    const providerValue = {
        setSrc, 
        src,

        filterName,
        setFilterName,

        openFilterControl,
        setOpenFilterControl,

        sliderConfigs,
        setSliderConfigs,

        imageError, 
        setImageError, 


        glCanvasRef, 
        rendererRef,
        filterFuncRef,
    };
    
    return (
        <ImageProcessingContext.Provider value={providerValue}>
            {children}
        </ImageProcessingContext.Provider>
    )
}