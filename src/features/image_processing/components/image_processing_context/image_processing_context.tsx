import WebGLRenderer from "../../../../utils/Scene/webGLRender";

// type Dimensions = {width : number; height: number} | null;

export interface ImageProcessingContextProps {
    src : string | undefined;
    setSrc : (value : string | undefined) => void;
    imageError : string | null;
    setImageError : (error : string | null) => void;
    handleImageUpload : (e : React.ChangeEvent<HTMLInputElement>) => void; 
    downloadWebGL : () => void;
    glCanvasRef : React.MutableRefObject<HTMLCanvasElement> | null;
    rendererRef : React.MutableRefObject<WebGLRenderer> | null;
}

export const defaultValue : ImageProcessingContextProps = {
    src : undefined,
    setSrc : () => {},
    imageError: null,
    setImageError : () => {},
    handleImageUpload  : () => {},
    downloadWebGL : () => {},
    glCanvasRef : null,
    rendererRef : null,
}