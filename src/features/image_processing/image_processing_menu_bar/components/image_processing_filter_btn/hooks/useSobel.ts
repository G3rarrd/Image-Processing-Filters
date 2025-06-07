import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLSobel from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLSobel";

function useSobel() {
    const {rendererRef} = useContext(ImageProcessingContext);

    function handleSobel () {
        if (! rendererRef || ! rendererRef.current) return;

        const sobel : WebGLSobel = rendererRef.current.compiledFilters.sobel;
        const texture : WebGLTexture = rendererRef.current.currentTexture;
        rendererRef.current.renderPipeline.addFilter(sobel);
        rendererRef.current.renderPipeline.renderPass(texture);
        rendererRef.current.renderScene();
    }

    return {handleSobel};
}

export default useSobel;