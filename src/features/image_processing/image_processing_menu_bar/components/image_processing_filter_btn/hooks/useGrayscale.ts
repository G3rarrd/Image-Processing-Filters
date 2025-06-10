import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLGrayScale from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLGrayscale";

function useGrayscale () {
    const {rendererRef, filterFuncRef} = useContext(ImageProcessingContext);

    function handleGrayscale () {
        if (! rendererRef || ! rendererRef.current) return;

        const grayscale : WebGLGrayScale =rendererRef.current.compiledFilters.grayScale;
        const currentTexture : WebGLTexture = rendererRef.current.currentTexture;

        filterFuncRef.current = () => {};
        
        rendererRef.current.renderPipeline.addFilter(grayscale);
        rendererRef.current.renderPipeline.renderPass(currentTexture);

        rendererRef.current.renderScene();
    }

    return {handleGrayscale};
}

export default useGrayscale;