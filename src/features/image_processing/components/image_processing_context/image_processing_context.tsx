import { RangeSlidersProps } from "../../../../types/slider";
import WebGLRenderer from "../../../../utils/Scene/webGLRender";

// type Dimensions = {width : number; height: number} | null;

export interface ImageProcessingContextProps {
    src : string | undefined;
    setSrc :React.Dispatch<React.SetStateAction<string | undefined>>;
    
    openFilterControl : boolean;
    setOpenFilterControl : React.Dispatch<React.SetStateAction<boolean>>;
    
    filterName : string;
    setFilterName : React.Dispatch<React.SetStateAction<string>>;

    sliderConfigs : RangeSlidersProps[];
    setSliderConfigs : React.Dispatch<React.SetStateAction<RangeSlidersProps[]>>;
    
    imageError : string | null;
    setImageError : (error : string | null) => void;

    downloadWebGL : () => void;

    glCanvasRef : React.MutableRefObject<HTMLCanvasElement | null>;
    rendererRef : React.MutableRefObject<WebGLRenderer | null>;
    filterFuncRef : React.MutableRefObject<(configs: RangeSlidersProps[]) => void>;
}

export const defaultValue : ImageProcessingContextProps = {
    src : undefined,
    setSrc : () => {},

    openFilterControl : false,
    setOpenFilterControl : () => {},

    filterName : '',
    setFilterName : () => {},

    sliderConfigs : [],
    setSliderConfigs : ()=> {},

    imageError: null,
    setImageError : () => {},

    downloadWebGL : () => {},

    glCanvasRef :  { current: null },
    rendererRef :  { current: null },
    filterFuncRef : {
        current: (configs: RangeSlidersProps[]) => {},
    } 
}