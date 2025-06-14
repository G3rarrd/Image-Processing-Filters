import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";
import WebGLGeneralizedKuwahara from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLGeneralizedKuwahara";

function useGeneralizedKuwahara () {
    const {rendererRef, setSliderConfigs,setOpenFilterControl, filterFuncRef} = useContext(ImageProcessingContext);
    function handleGeneralizedKuwaharaClick () {
        if (! rendererRef || ! rendererRef.current) return;
        
        setOpenFilterControl(() => true);
        
        const renderer : WebGLRenderer = rendererRef.current;
        const gerneralizedKuwahara : WebGLGeneralizedKuwahara = renderer.compiledFilters.generalizedKuwahara;
        setSliderConfigs([...gerneralizedKuwahara.config]);

        filterFuncRef.current = (configs) => {
            let radius : number | undefined = configs.find(cfg => cfg.label === "Radius")?.value;
            let hardness : number | undefined = configs.find(cfg => cfg.label === "Hardness")?.value;
            let q : number | undefined = configs.find(cfg => cfg.label === "Q")?.value;
            let zeta : number | undefined = configs.find(cfg => cfg.label === "Zeta")?.value;
            let zeroCrossing : number | undefined = configs.find(cfg => cfg.label === "Zero Crossing")?.value;
        
            if (radius === undefined) {
                console.warn("Radius label was not found using initial value");
                radius = 3;
            }

            if (hardness === undefined) {
                console.warn("hardness label was not found using initial value");
                hardness = 100;
            }
            if (q === undefined) {
                console.warn("q label was not found using initial value");
                q = 18;
            }

            if (zeta === undefined) {
                console.warn("zeta label was not found using initial value");
                zeta = 2;
            }

            if (zeroCrossing === undefined) {
                console.warn("Zero Crossing label was not found using initial value");
                zeroCrossing = 0.01;
            }

            gerneralizedKuwahara.setAttributes(radius, hardness, q, zeta, zeroCrossing);
            renderer.renderPipeline.addFilter(gerneralizedKuwahara);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            rendererRef.current.renderScene();
        }

        filterFuncRef.current(gerneralizedKuwahara.config); // Applies on click
    }
    return {handleGeneralizedKuwaharaClick};
}

export default useGeneralizedKuwahara;