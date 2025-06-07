import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLEmboss from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLEmboss";

function useEmboss() {
    const {rendererRef} = useContext(ImageProcessingContext);

    function handleEmboss () {
        if (! rendererRef || ! rendererRef.current) return;

        const emboss : WebGLEmboss = rendererRef.current.compiledFilters.emboss;
        const texture : WebGLTexture = rendererRef.current.currentTexture;
        rendererRef.current.renderPipeline.addFilter(emboss);
        rendererRef.current.renderPipeline.renderPass(texture);
        rendererRef.current.renderScene();
    }

    return {handleEmboss};
}

export default useEmboss;