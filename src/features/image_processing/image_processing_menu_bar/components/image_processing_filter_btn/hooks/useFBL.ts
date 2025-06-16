import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLFBL from "../../../../../../utils/ShaderCodes/postprocessingEffects/compositeTextures/WebGLFBL";
import WebGLCore from "../../../../../../utils/webGLCore";
import WebGLCompileFilters from "../../../../../../utils/ShaderCodes/postprocessingEffects/webGLCompileFilters";
import FramebufferPool from '../../../../../../utils/framebuffer_textures/framebufferPool';

function useFBL () {
    const {rendererRef,setOpenFilterControl, setSliderConfigs, filterFuncRef} = useContext(ImageProcessingContext);

    function handleFBLClick () {
        if (! rendererRef || ! rendererRef.current) return;

        setOpenFilterControl(() => true);

        const renderer = rendererRef.current;
        const wgl : WebGLCore = renderer.wgl;
        const compiledFilters : WebGLCompileFilters = renderer.compiledFilters;
        const framebufferPool: FramebufferPool = renderer.framebufferPool;
        const fbl = new WebGLFBL(wgl, framebufferPool, compiledFilters);

        setSliderConfigs([...fbl.config]);

        filterFuncRef.current = (config) => {
            let sigmaE : number | undefined = config.find(cfg => cfg.label === "Radius E")?.value;
            let rangeSigmaE : number | undefined = config.find(cfg => cfg.label === "Range Radius E")?.value;
            let sigmaG : number | undefined  = config.find(cfg => cfg.label === "Radius G")?.value;
            let rangeSigmaG : number | undefined = config.find(cfg => cfg.label === "Range Radius G")?.value;
            let etfKernelSize : number | undefined =config.find(cfg => cfg.label === "ETF Kernel Size")?.value;
            let colorCount : number | undefined = config.find(cfg => cfg.label === "Color Count")?.value;
            let iteration : number | undefined = config.find(cfg => cfg.label === "Iteration")?.value;
            let spreadValue : number | undefined = config.find(cfg => cfg.label === "Spread Value")?.value;
        
            if (sigmaE === undefined ) {
                console.warn("Radius E label was not found using initial value");
                sigmaE = 1.6;
            }
            
            if (rangeSigmaE === undefined ) {
                console.warn("Range Radius E label was not found using initial value");
                rangeSigmaE = 1.6;
            }

            if (sigmaG === undefined ) {
                console.warn("Radius E label was not found using initial value");
                sigmaG = 1.6;
            }
            
            if (rangeSigmaG === undefined ) {
                console.warn("Range Radius E label was not found using initial value");
                rangeSigmaG = 1.6;
            }

            if (etfKernelSize === undefined ) {
                console.warn("ETF kernel size label was not found using initial value");
                etfKernelSize = 3;
            }

            if (spreadValue === undefined || spreadValue === null) {
                console.warn("Spread Value label was not found using initial value");
                spreadValue = 2;
            }

            if (colorCount  === undefined || colorCount  === null)  {
                console.warn("Color Count label was not found using initial value");
                colorCount = 2;
            }

            if (iteration === undefined ) {
                console.warn("Epsilon label was not found using initial value");
                iteration = 1;
            }
            
            fbl.setAttributes(etfKernelSize, sigmaE, sigmaG, rangeSigmaE, rangeSigmaG, iteration, colorCount, spreadValue);
            renderer.renderPipeline.addFilter(fbl);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(fbl.config);
    }


    return {handleFBLClick};
}

export default useFBL;
