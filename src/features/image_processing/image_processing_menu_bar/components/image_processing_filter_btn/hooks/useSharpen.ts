import { useContext} from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLSharpen from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLSharpen";

function useSharpen() {
    const {rendererRef} = useContext(ImageProcessingContext);

    function handleSharpen () {
        if (! rendererRef || ! rendererRef.current) return;

        const sharpen : WebGLSharpen = rendererRef.current.compiledFilters.sharpen;
        const texture : WebGLTexture = rendererRef.current.currentTexture;
        rendererRef.current.renderPipeline.addFilter(sharpen);
        rendererRef.current.renderPipeline.renderPass(texture);
        rendererRef.current.renderScene();
    }

    return {handleSharpen};
}

export default useSharpen;