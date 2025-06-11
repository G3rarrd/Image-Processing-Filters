import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLGaussianBlur from "../../../../../../utils/ShaderCodes/postprocessingEffects/compositeTextures/webGLGaussianBlur";
import WebGLCore from "../../../../../../utils/webGLCore";
import WebGLCompileFilters from "../../../../../../utils/ShaderCodes/postprocessingEffects/webGLCompileFilters";
import FramebufferPool from '../../../../../../utils/framebuffer_textures/framebufferPool';

function useGaussianBlur () {
    const {setSliderConfigs, setOpenFilterControl, rendererRef, filterFuncRef} = useContext(ImageProcessingContext);
    
    function handleGaussianBlurClick () {
        if (!rendererRef || !rendererRef.current) return;

        setOpenFilterControl(() => true);

        const wgl : WebGLCore = rendererRef.current.wgl;
        const compiledFilter : WebGLCompileFilters = rendererRef.current.compiledFilters;
        const framebufferPool : FramebufferPool = rendererRef.current.framebufferPool;
        const gaussianBlur : WebGLGaussianBlur = new WebGLGaussianBlur(wgl, compiledFilter,framebufferPool);
        const renderer = rendererRef.current;

        setSliderConfigs([...gaussianBlur.config]);

        filterFuncRef.current = (configs) => {
            let radius : number | undefined = configs.find(cfg => cfg.label === 'Radius')?.value;

            if (radius === undefined) {
                console.warn("Radius label is not found was not found initial value is currently used");
                radius = 1.6;
            }

            gaussianBlur.setAttributes(radius);
            renderer.renderPipeline.addFilter(gaussianBlur);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(gaussianBlur.config);
    }
    return {handleGaussianBlurClick};
}

export default useGaussianBlur;