import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLEmboss from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLEmboss";

function useEmboss() {
    const {rendererRef, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);

    function handleEmbossClick () {
        if (! rendererRef || ! rendererRef.current) return;
        const filterName : string ="Emboss"; 
        setFilterName(filterName);
        const emboss : WebGLEmboss = rendererRef.current.compiledFilters.emboss;
        const renderer = rendererRef.current;
        
        filterFuncRef.current = () => {};
        
        renderer.renderPipeline.addFilter(emboss);
        renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
        renderer.renderScene();
        
        const imgWidth = renderer.img.naturalWidth;
        const imgHeight = renderer.img.naturalHeight;
        renderer.historyStack.add(renderer.currentTexture, imgWidth, imgHeight);
        renderer.holdCurrentTexture  = renderer.historyStack.getUndoStackTop();
    }

    return { handleEmbossClick};
}

export default useEmboss;