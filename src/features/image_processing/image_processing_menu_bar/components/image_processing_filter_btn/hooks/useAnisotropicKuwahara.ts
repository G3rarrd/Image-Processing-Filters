import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";
import WebGLAnisotropicKuwahara from "../../../../../../utils/ShaderCodes/postprocessingEffects/compositeTextures/webGLAnisotropicKuwahara";
import WebGLCore from "../../../../../../utils/webGLCore";
import WebGLCompileFilters from "../../../../../../utils/ShaderCodes/postprocessingEffects/webGLCompileFilters";
import FramebufferPool from "../../../../../../utils/framebuffer_textures/framebufferPool";


function useAnisotropicKuwahara () {
    const {rendererRef, setSliderConfigs,setOpenFilterControl, filterFuncRef} = useContext(ImageProcessingContext);
    function handleAnisotropicKuwaharaClick () {
        if (! rendererRef || ! rendererRef.current) return;
        
        setOpenFilterControl(() => true);
        const renderer : WebGLRenderer = rendererRef.current;
        const wgl : WebGLCore = rendererRef.current.wgl;
        const compiledFilter : WebGLCompileFilters = rendererRef.current.compiledFilters;
        const framebufferPool : FramebufferPool = rendererRef.current.framebufferPool;
        
        const anisotropicKuwahara = new WebGLAnisotropicKuwahara(wgl, compiledFilter, framebufferPool);
        setSliderConfigs([...anisotropicKuwahara.config]);

        filterFuncRef.current = (configs) => {
            let radius : number | undefined = configs.find(cfg => cfg.label === "Radius")?.value;
            let hardness : number | undefined = configs.find(cfg => cfg.label === "Hardness")?.value;
            let sharpness : number | undefined = configs.find(cfg => cfg.label === "Sharpness")?.value;
            let zeta : number | undefined = configs.find(cfg => cfg.label === "Zeta")?.value;
            let zeroCrossing : number | undefined = configs.find(cfg => cfg.label === "Zero Crossing")?.value;
            let alpha : number | undefined = configs.find(cfg => cfg.label === "Alpha")?.value;
            let sigma : number | undefined = configs.find(cfg => cfg.label === "Sigma C")?.value;

            if (radius === undefined) {
                console.warn("Radius label was not found using initial value");
                radius = 3;
            }

            if (hardness === undefined) {
                console.warn("hardness label was not found using initial value");
                hardness = 100;
            }
            if (sharpness === undefined) {
                console.warn("Sharpness label was not found using initial value");
                sharpness = 18;
            }

            if (zeta === undefined) {
                console.warn("zeta label was not found using initial value");
                zeta = 2;
            }

            if (zeroCrossing === undefined) {
                console.warn("Zero Crossing label was not found using initial value");
                zeroCrossing = 0.01;
            }

            if (alpha === undefined) {
                console.warn("Alpha label was not found using initial value");
                alpha = 0.01;
            }

            if (sigma === undefined) {
                console.warn("Sigma label was not found using initial value");
                sigma = 0.01;
            }

            anisotropicKuwahara.setAttributes(radius, hardness, sharpness, zeta, zeroCrossing, alpha, sigma);
            renderer.renderPipeline.addFilter(anisotropicKuwahara);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(anisotropicKuwahara.config); // Applies on click
    }
    return {handleAnisotropicKuwaharaClick};
}

export default useAnisotropicKuwahara;