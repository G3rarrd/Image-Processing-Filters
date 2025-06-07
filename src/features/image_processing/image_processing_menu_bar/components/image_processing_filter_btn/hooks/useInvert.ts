import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLInvert from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLInvert";

function useInvert() {
    const {rendererRef} = useContext(ImageProcessingContext);

    function handleInvert () {
        if (! rendererRef || ! rendererRef.current) return;

        const invert : WebGLInvert = rendererRef.current.compiledFilters.invert;
        const texture : WebGLTexture = rendererRef.current.currentTexture;
        rendererRef.current.renderPipeline.addFilter(invert);
        rendererRef.current.renderPipeline.renderPass(texture);
        rendererRef.current.renderScene();
    }

    return {handleInvert};
}

export default useInvert;