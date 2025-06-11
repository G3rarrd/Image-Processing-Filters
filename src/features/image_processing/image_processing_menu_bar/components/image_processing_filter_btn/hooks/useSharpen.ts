import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLSharpen from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLSharpen";

function useSharpen() {
    const {rendererRef, filterFuncRef} = useContext(ImageProcessingContext);

    function handleSharpen () {
        if (! rendererRef || ! rendererRef.current) return;

        const sharpen : WebGLSharpen = rendererRef.current.compiledFilters.sharpen;
        const renderer = rendererRef.current;

        filterFuncRef.current = () => {};
        
        renderer.renderPipeline.addFilter(sharpen);
        renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
        renderer.renderScene();
        
        
        const imgWidth = renderer.img.naturalWidth;
        const imgHeight = renderer.img.naturalHeight;
        renderer.historyStack.add(renderer.currentTexture, imgWidth, imgHeight);
        renderer.holdCurrentTexture  = renderer.historyStack.getUndoStackTop(); // Update the texture
    }

    return {handleSharpen};
}

export default useSharpen;