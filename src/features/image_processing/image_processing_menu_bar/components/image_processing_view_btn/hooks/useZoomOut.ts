import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";

function useZoomOut () {
    const {rendererRef} = useContext(ImageProcessingContext); 
    const handleZoomOut = () => {
        if (! rendererRef || ! rendererRef.current) return;
        
        const renderer : WebGLRenderer = rendererRef.current;
        renderer.cam.zoom([0, 0], -1);
        renderer.renderScene();
    }

    return {handleZoomOut};
}

export default useZoomOut;