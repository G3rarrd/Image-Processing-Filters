import { ImageProcessingContextProps, defaultValue } from './image_processing_context';

import { createContext, useState, ReactNode, useRef} from 'react';

import WebGLImageExporter from '../../../../utils/webGLImageExporter';
import WebGLRenderer from '../../../../utils/Scene/webGLRender';

export const ImageProcessingContext = createContext<ImageProcessingContextProps>(defaultValue);

export const ImageProcessingProvider : React.FC<{children : ReactNode}> = ({children}) => {
    const [src, setSrc] = useState<string | undefined>(defaultValue.src);
    const [imageError, setImageError] = useState<string | null>(null);
    const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    
    const handleImageUpload = ( e : React.ChangeEvent<HTMLInputElement>) : void => {
                if (e.target.files && e.target.files.length > 0) {
                    const url = URL.createObjectURL(e.target.files![0]);
                    setSrc(url);
                }   
            };

    const downloadWebGL = () : void => {
        const img = new Image();
        if(!src) throw new Error("Image Source not Found");
        img.src = src
        const glCanvas: HTMLCanvasElement | null = glCanvasRef.current;
        const gl : WebGL2RenderingContext | null | undefined = glCanvas?.getContext('webgl2');
        
        if (! gl ) throw new Error("Unable to download image: WebGL Not found")
        if (! rendererRef.current) throw new Error("Unable to download image: Rendered Image not Found")
        
        const download = new WebGLImageExporter(gl);
        if (! rendererRef.current.currentTexture) throw new Error("Unable to download image: No texture Found")
        
        download.export(rendererRef.current.currentTexture, img.naturalWidth, img.naturalHeight);
    }


    const providerValue = {setSrc, src, imageError, setImageError, handleImageUpload, downloadWebGL, glCanvasRef, rendererRef};
    
    return (
        <ImageProcessingContext.Provider value={providerValue}>
            {children}
        </ImageProcessingContext.Provider>
    )
}