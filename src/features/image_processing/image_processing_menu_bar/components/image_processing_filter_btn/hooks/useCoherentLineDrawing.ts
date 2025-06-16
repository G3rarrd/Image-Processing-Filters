import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLCore from "../../../../../../utils/webGLCore";
import WebGLCompileFilters from "../../../../../../utils/ShaderCodes/postprocessingEffects/webGLCompileFilters";
import FramebufferPool from "../../../../../../utils/framebuffer_textures/framebufferPool";
import WebGLCoherentLineDrawing from "../../../../../../utils/ShaderCodes/postprocessingEffects/compositeTextures/webGLCoherentLineDrawing";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";

function useCoherentLineDrawing () {
    const {rendererRef,setOpenFilterControl, filterFuncRef, setSliderConfigs, setFilterName} = useContext(ImageProcessingContext);
    
    function handleFDoGClick() {
        if (!rendererRef || ! rendererRef.current) return;
        const filterName : string ="Coherent Line Drawing"; 
        setFilterName(filterName);
        setOpenFilterControl(() => true);
        const renderer : WebGLRenderer =rendererRef.current; 
        const wgl : WebGLCore = renderer.wgl;
        const compiledFilter : WebGLCompileFilters = renderer.compiledFilters;
        const framebufferPool : FramebufferPool = renderer.framebufferPool;
        const fDoG : WebGLCoherentLineDrawing = new WebGLCoherentLineDrawing(wgl, framebufferPool, compiledFilter);


        setSliderConfigs([...fDoG.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (configs) => {
            let sigmaM : number | undefined= configs.find(cfg => cfg.label === "Radius M")?.value;
            let sigmaC : number | undefined = configs.find(cfg => cfg.label === "Thickness")?.value;
            let etfKernelSize : number | undefined = configs.find(cfg => cfg.label === "ETF Kernel Size")?.value;
            let tau : number | undefined= configs.find(cfg => cfg.label === "Tau")?.value;
            let p : number | undefined = configs.find(cfg => cfg.label === "P")?.value;
            let iteration : number | undefined= configs.find(cfg => cfg.label === "Iteration")?.value;



            if (sigmaM === undefined ) {
                console.warn("Radius M label was not found using initial value");
                sigmaM = 1.6;
            }
            
            if (sigmaC === undefined ) {
                console.warn("Thickness label was not found using initial value");
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
export default useCoherentLineDrawing;