import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";
import WebGLGeneralizedKuwahara from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLGeneralizedKuwahara";

function useGeneralizedKuwahara () {
    const {rendererRef, setSliderConfigs,setOpenFilterControl, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);
    function handleGeneralizedKuwaharaClick () {
        if (! rendererRef || ! rendererRef.current) return;
        const filterName : string ="Generalized Kuwahara"; 
        setFilterName(filterName);
        setOpenFilterControl(() => true);
        
        const renderer : WebGLRenderer = rendererRef.current;
        const gerneralizedKuwahara : WebGLGeneralizedKuwahara = renderer.compiledFilters.generalizedKuwahara;
        setSliderConfigs([...gerneralizedKuwahara.config]);

        filterFuncRef.current = (configs) => {
            let radius : number | undefined = configs.find(cfg => cfg.label === "Radius")?.value;
            let hardness : number | undefined = configs.find(cfg => cfg.label === "Hardness")?.value;
            let sharpness : number | undefined = configs.find(cfg => cfg.label === "Sharpness")?.value;
            let zeta : number | undefined = configs.find(cfg => cfg.label === "Zeta")?.value;
            let angle : number | undefined = configs.find(cfg => cfg.label === "Angle")?.value;
        
            if (radius === undefined) {
                console.warn("Radius label was not found using initial value");
                radius = 3;
            }

            if (hardness === undefined) {
                console.warn("hardness label was not found using initial value");
                hardness = 100;
            }
            if (sharpness === undefined) {
                console.warn("sharpness label was not found using initial value");
                sharpness = 18;
            }

            if (zeta === undefined) {
                console.warn("zeta label was not found using initial value");
                zeta = 2;
            }

            if (angle === undefined) {
                console.warn("Angle label was not found using initial value");
                angle = 0.01;
            }

            gerneralizedKuwahara.setAttributes(radius, hardness, sharpness, zeta, angle);
            renderer.renderPipeline.addFilter(gerneralizedKuwahara);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(gerneralizedKuwahara.config); // Applies on click
    }
    return {handleGeneralizedKuwaharaClick};
}

export default useGeneralizedKuwahara;