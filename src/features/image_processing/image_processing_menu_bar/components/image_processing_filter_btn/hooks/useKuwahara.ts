import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";
import WebGLKuwahara from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLKuwahara";

function useKuwahara () {
    const {rendererRef, setSliderConfigs,setOpenFilterControl, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);
    function handleKuwaharaClick () {
        if (! rendererRef || ! rendererRef.current) return;
        const filterName : string ="Kuwahara"; 
        setFilterName(filterName);
        setOpenFilterControl(() => true);
        
        const renderer : WebGLRenderer = rendererRef.current;
        const kuwahara : WebGLKuwahara = renderer.compiledFilters.kuwahara;
        setSliderConfigs([...kuwahara.config]);

        filterFuncRef.current = (configs) => {
            let radius : number | undefined = configs.find(cfg => cfg.label === "Radius")?.value;

            if (radius === undefined) {
                console.warn("Radius label was not found using initial value");
                radius = 3;
            }

            kuwahara.setAttributes(radius);
            renderer.renderPipeline.addFilter(kuwahara);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(kuwahara.config); // Applies on click
    }
    return {handleKuwaharaClick};
}

export default useKuwahara;