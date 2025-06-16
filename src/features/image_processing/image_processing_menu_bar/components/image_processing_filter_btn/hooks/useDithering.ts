import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLDithering from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLDithering";

function useDithering () {
    const {rendererRef, setOpenFilterControl, filterFuncRef, setSliderConfigs, setFilterName} = useContext(ImageProcessingContext);
    
    function handleDithering() {
        if (!rendererRef || ! rendererRef.current) return;
        const filterName : string ="Dithering"; 
        setFilterName(filterName);
        setOpenFilterControl(() => true);

        const dithering : WebGLDithering = rendererRef.current.compiledFilters.dithering;
        const renderer = rendererRef.current;

        setSliderConfigs([...dithering.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (config) => {
            let spreadValue = config.find(cfg => cfg.label === "Spread Value")?.value;
            let bayerType  = config.find(cfg => cfg.label === "Bayer Type")?.value;

            if (spreadValue === undefined || spreadValue === null) {
                console.warn("Spread Value label was not found using initial value");
                spreadValue = 2;
                console.log(spreadValue);
            }
            
            if (bayerType === undefined || bayerType === null) {
                console.warn("Bayer Type label was not found using initial value");
                bayerType = 2;
            }
            
            dithering.setAttributes(spreadValue, bayerType);
            renderer.renderPipeline.addFilter(dithering);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(dithering.config); // Applies on click
    }
    return {handleDithering};
}
export default useDithering;