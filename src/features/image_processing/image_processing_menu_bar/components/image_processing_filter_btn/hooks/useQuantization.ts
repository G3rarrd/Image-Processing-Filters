import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLQuantization from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLQuantization";

function useQuantization () {
    const {rendererRef, setSliderConfigs, setOpenFilterControl, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);
    
    function handleQuantizationClick() {
        if (!rendererRef || ! rendererRef.current) return;
        const filterName : string ="Quantization"; 
        setFilterName(filterName);
        setOpenFilterControl(() => true);

        const quantization : WebGLQuantization = rendererRef.current.compiledFilters.quantization;
        const renderer = rendererRef.current;
        
        setSliderConfigs([...quantization.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (config) => {
            let colorCount = config.find(cfg => cfg.label === "Color Count")?.value;
            
            if (colorCount  === undefined || colorCount  === null)  {
                console.warn("Color Count label was not found using initial value");
                colorCount = 2;
            }
            
            quantization.setAttributes(colorCount);
            renderer.renderPipeline.addFilter(quantization);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(quantization.config); // Applies on click
    }
    return {handleQuantizationClick};
}
export default useQuantization;