import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLGrayScale from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLGrayscale";

function useGrayscale () {
    const {rendererRef, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);

    function handleGrayscale () {
        if (! rendererRef || !rendererRef.current) return;
        const filterName : string ="Grayscale"; 
        setFilterName(filterName);
        const renderer = rendererRef.current;
        const grayscale : WebGLGrayScale =renderer.compiledFilters.grayScale;
        // let currentTexture : WebGLTexture = renderer.currentTexture;

        filterFuncRef.current = () => {};
        
        renderer.renderPipeline.addFilter(grayscale);
        renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
        renderer.renderScene();

        
        const imgWidth = renderer.img.naturalWidth;
        const imgHeight = renderer.img.naturalHeight;
        renderer.historyStack.add(renderer.currentTexture, imgWidth, imgHeight);

        renderer.holdCurrentTexture = renderer.historyStack.getUndoStackTop();
    }

    return {handleGrayscale};
}

export default useGrayscale;