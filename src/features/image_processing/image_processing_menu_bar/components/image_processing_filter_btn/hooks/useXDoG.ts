import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLXDoG from "../../../../../../utils/ShaderCodes/postprocessingEffects/compositeTextures/webGLXDoG";
import WebGLCore from "../../../../../../utils/webGLCore";
import WebGLCompileFilters from "../../../../../../utils/ShaderCodes/postprocessingEffects/webGLCompileFilters";
import FramebufferPool from "../../../../../../utils/framebuffer_textures/framebufferPool";

function useXDoG () {
    const {rendererRef, filterFuncRef, setSliderConfigs} = useContext(ImageProcessingContext);
    
    function handleXDoGClick() {
        if (!rendererRef || ! rendererRef.current) return;
        const wgl : WebGLCore = rendererRef.current.wgl;
        const compiledFilter : WebGLCompileFilters = rendererRef.current.compiledFilters;
        const framebufferPool : FramebufferPool = rendererRef.current.framebufferPool;
        const xDoG : WebGLXDoG = new WebGLXDoG(wgl, framebufferPool,compiledFilter);

        const texture : WebGLTexture = rendererRef.current.currentTexture;
        setSliderConfigs([...xDoG.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (configs) => {
            let sigmaE : number | undefined= configs.find(cfg => cfg.label === "Radius E")?.value;
            let sigmaM : number | undefined= configs.find(cfg => cfg.label === "Radius M")?.value;
            let sigmaA : number | undefined = configs.find(cfg => cfg.label === "Radius A")?.value;
            let sigmaC : number | undefined = configs.find(cfg => cfg.label === "Radius C")?.value;
            let tau : number | undefined= configs.find(cfg => cfg.label === "Tau")?.value;
            let phi : number | undefined = configs.find(cfg => cfg.label === "Phi")?.value;
            let epsilon : number | undefined= configs.find(cfg => cfg.label === "Epsilon")?.value;


            if (sigmaE === undefined ) {
                console.warn("Radius E label was not found using initial value");
                sigmaE = 1.6;
            }

            if (sigmaM === undefined ) {
                console.warn("Radius M label was not found using initial value");
                sigmaM = 1.6;
            }

            if (sigmaA === undefined ) {
                console.warn("Radius A label was not found using initial value");
                sigmaA = 1.6;
            }

            if (sigmaC === undefined ) {
                console.warn("Radius C label was not found using initial value");
                sigmaC = 1.6;
            }

            if (tau === undefined ) {
                console.warn("Tau label was not found using initial value");
                tau = 10.6;
            }
            if (phi === undefined ) {
                console.warn("Phi label was not found using initial value");
                phi = 1.6;
            }
            if (epsilon === undefined ) {
                console.warn("Epsilon label was not found using initial value");
                epsilon = 0.8;
            }


            
            xDoG.setAttributes(sigmaC, sigmaE,sigmaM, sigmaA, tau, phi, epsilon) ;
            rendererRef.current.renderPipeline.addFilter(xDoG);
            rendererRef.current.renderPipeline.renderPass(texture);
            rendererRef.current.renderScene();
        }

        filterFuncRef.current(xDoG.config); // Applies on click

        
    }
    return {handleXDoGClick};
}
export default useXDoG;