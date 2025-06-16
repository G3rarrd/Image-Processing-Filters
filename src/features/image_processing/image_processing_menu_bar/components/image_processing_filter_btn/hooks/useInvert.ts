import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLInvert from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLInvert";

function useInvert() {
    const {rendererRef, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);

    function handleInvert () {
        if (! rendererRef || ! rendererRef.current) return;
        const filterName : string ="Invert"; 
        setFilterName(filterName);
        const invert : WebGLInvert = rendererRef.current.compiledFilters.invert;
        const renderer = rendererRef.current;
        filterFuncRef.current = () => {};
        
        renderer.renderPipeline.addFilter(invert);
        renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
        renderer.renderScene();
        
    
        const imgWidth = renderer.img.naturalWidth;
        const imgHeight = renderer.img.naturalHeight;
        renderer.historyStack.add(renderer.currentTexture, imgWidth, imgHeight);
        renderer.holdCurrentTexture  = renderer.historyStack.getUndoStackTop();
    }

    return {handleInvert};
}

export default useInvert;