import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLCore from "../../../../../../utils/webGLCore";
import WebGLCompileFilters from "../../../../../../utils/ShaderCodes/postprocessingEffects/webGLCompileFilters";
import FramebufferPool from "../../../../../../utils/framebuffer_textures/framebufferPool";
import WebGLFDoG from "../../../../../../utils/ShaderCodes/postprocessingEffects/compositeTextures/webGLFDoG";

function useFDoG () {
    const {rendererRef,setOpenFilterControl, filterFuncRef, setSliderConfigs} = useContext(ImageProcessingContext);
    
    function handleFDoGClick() {
        if (!rendererRef || ! rendererRef.current) return;

        setOpenFilterControl(() => true);

        const wgl : WebGLCore = rendererRef.current.wgl;
        const compiledFilter : WebGLCompileFilters = rendererRef.current.compiledFilters;
        const framebufferPool : FramebufferPool = rendererRef.current.framebufferPool;
        const fDoG : WebGLFDoG = new WebGLFDoG(wgl, framebufferPool, compiledFilter);

        const renderer = rendererRef.current;
        setSliderConfigs([...fDoG.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (configs) => {
            let sigmaM : number | undefined= configs.find(cfg => cfg.label === "Radius M")?.value;
            let sigmaC : number | undefined = configs.find(cfg => cfg.label === "Radius C")?.value;
            let etfKernelSize : number | undefined = configs.find(cfg => cfg.label === "ETF Kernel Size")?.value;
            let tau : number | undefined= configs.find(cfg => cfg.label === "Tau")?.value;
            let p : number | undefined = configs.find(cfg => cfg.label === "P")?.value;
            let iteration : number | undefined= configs.find(cfg => cfg.label === "Iteration")?.value;



            if (sigmaM === undefined ) {
                console.warn("Radius M label was not found using initial value");
                sigmaM = 1.6;
            }
            
            if (sigmaC === undefined ) {
                console.warn("Radius C label was not found using initial value");
                sigmaC = 1.6;
            }

            if (etfKernelSize === undefined ) {
                console.warn("ETF kernel size label was not found using initial value");
                etfKernelSize = 3;
            }

            if (tau === undefined ) {
                console.warn("Tau label was not found using initial value");
                tau = 10.6;
            }
            if (p === undefined ) {
                console.warn("Phi label was not found using initial value");
                p = 0.90;
            }
            if (iteration === undefined ) {
                console.warn("Epsilon label was not found using initial value");
                iteration = 1;
            }
            
            fDoG.setAttributes(sigmaC, sigmaM, etfKernelSize, tau, p, iteration);
            renderer.renderPipeline.addFilter(fDoG);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(fDoG.config); // Applies on click
    }
    return {handleFDoGClick};
}
export default useFDoG;