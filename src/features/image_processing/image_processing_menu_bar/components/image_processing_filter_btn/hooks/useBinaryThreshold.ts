import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLBinaryThreshold from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLBinaryThresholding";
function useBinaryThreshold () {
    const {rendererRef, setOpenFilterControl, setSliderConfigs, filterFuncRef} = useContext(ImageProcessingContext);
    
    function handleBinaryThresholdClick() {
        if (!rendererRef || ! rendererRef.current) return;

        setOpenFilterControl(() => true);

        const binaryThreshold : WebGLBinaryThreshold = rendererRef.current.compiledFilters.binaryThreshold;
        const renderer = rendererRef.current;
        
        setSliderConfigs([...binaryThreshold.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (config) => {
            let threshold = config.find(cfg => cfg.label === "Threshold")?.value;
            
            if (threshold  === undefined || threshold  === null) {
                console.warn("Threshold label was not found using initial value");
                threshold = 0.5;
            }
            
            binaryThreshold.setAttributes(threshold);
            rendererRef.current.renderPipeline.addFilter(binaryThreshold);
                        renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            rendererRef.current.renderScene();
        }

        filterFuncRef.current(binaryThreshold.config); // Applies on click
    }
    return {handleBinaryThresholdClick};
}
export default useBinaryThreshold;