import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLSobel from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLSobel";

function useSobel() {
    const {rendererRef, filterFuncRef} = useContext(ImageProcessingContext);

    function handleSobel () {
        if (! rendererRef || ! rendererRef.current) return;

        

        const sobel : WebGLSobel = rendererRef.current.compiledFilters.sobel;
        const renderer = rendererRef.current;
        
        filterFuncRef.current = () => {};
        
        renderer.renderPipeline.addFilter(sobel);
        renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
        renderer.renderScene();
        
        const imgWidth = renderer.img.naturalWidth;
        const imgHeight = renderer.img.naturalHeight;
        renderer.historyStack.add(renderer.currentTexture, imgWidth, imgHeight);
        renderer.holdCurrentTexture  = renderer.historyStack.getUndoStackTop();
    }

    return {handleSobel};
}

export default useSobel;