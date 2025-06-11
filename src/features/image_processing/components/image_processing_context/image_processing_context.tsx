import { RangeSlidersProps } from "../../../../types/slider";
import WebGLRenderer from "../../../../utils/Scene/webGLRender";

// type Dimensions = {width : number; height: number} | null;

export interface ImageProcessingContextProps {
    src : string | undefined;
    setSrc :React.Dispatch<React.SetStateAction<string | undefined>>;
    
    openFilterControl : boolean;
    setOpenFilterControl : React.Dispatch<React.SetStateAction<boolean>>;
    
    sliderConfigs : RangeSlidersProps[];
    setSliderConfigs : React.Dispatch<React.SetStateAction<RangeSlidersProps[]>>;
    
    imageError : string | null;
    setImageError : (error : string | null) => void;

    handleImageUpload : (e : React.ChangeEvent<HTMLInputElement>) => void; 
    downloadWebGL : () => void;

    glCanvasRef : React.MutableRefObject<HTMLCanvasElement> | null;
    rendererRef : React.MutableRefObject<WebGLRenderer> | null;
    filterFuncRef : React.MutableRefObject<(configs: RangeSlidersProps[]) => void>;
}

export const defaultValue : ImageProcessingContextProps = {
    src : undefined,
    setSrc : () => {},

    openFilterControl : false,
    setOpenFilterControl : () => {},

    sliderConfigs : [],
    setSliderConfigs : ()=> {},

    imageError: null,
    setImageError : () => {},

    handleImageUpload  : () => {},
    downloadWebGL : () => {},

    glCanvasRef : null,
    rendererRef : null,
    filterFuncRef : {
        current: (configs: RangeSlidersProps[]) => {},
    } 
}