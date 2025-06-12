import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";

function useZoomIn () {
    const {rendererRef} = useContext(ImageProcessingContext); 
    const handleZoomIn = () => {
        if (! rendererRef || ! rendererRef.current) return;
        
        const renderer : WebGLRenderer = rendererRef.current;
        renderer.cam.zoom([0, 0], 1);
        renderer.renderScene();
    }

    return {handleZoomIn};
}

export default useZoomIn;