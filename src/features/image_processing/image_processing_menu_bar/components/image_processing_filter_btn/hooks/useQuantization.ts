import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLQuantization from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLQuantization";

function useQuantization () {
    const {rendererRef, setSliderConfigs, filterFuncRef} = useContext(ImageProcessingContext);
    
    function handleQuantizationClick() {
        if (!rendererRef || ! rendererRef.current) return;

        const quantization : WebGLQuantization = rendererRef.current.compiledFilters.quantization;
        const texture : WebGLTexture = rendererRef.current.currentTexture;
        
        setSliderConfigs([...quantization.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (config) => {
            let colorCount = config.find(cfg => cfg.label === "Color Count")?.value;
            
            if (colorCount  === undefined || colorCount  === null)  {
                console.warn("Color Count label was not found using initial value");
                colorCount = 2;
            }
            
            quantization.setAttributes(colorCount);
            rendererRef.current.renderPipeline.addFilter(quantization);
            rendererRef.current.renderPipeline.renderPass(texture);
            rendererRef.current.renderScene();
        }

        filterFuncRef.current(quantization.config); // Applies on click
    }
    return {handleQuantizationClick};
}
export default useQuantization;