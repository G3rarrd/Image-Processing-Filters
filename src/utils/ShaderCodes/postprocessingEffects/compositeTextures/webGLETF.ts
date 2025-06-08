import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLETFSmoothingPass from "../nonCompositeTextures/webGLETFSmoothingPass";
import WebGLFlowField from "../nonCompositeTextures/webGLFlowField";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';


class WebGLETF implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly compiledFilters : WebGLCompileFilters;
    private readonly framebufferPool : FramebufferPool;
    private  etfKernelSize : number = 3;

    constructor (
        wgl: WebGLCore,
        compiledFilters : WebGLCompileFilters,
        framebufferPool : FramebufferPool,
    ) {
        this.wgl = wgl;
        this.compiledFilters = compiledFilters;
        this.framebufferPool = framebufferPool;
    }

    public setAttributes (etfKernelSize : number) {
        this.etfKernelSize = etfKernelSize;
    }
    
    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        /**
         * A composite shader that uses 1 Texture
         * @param inputTextures[0] is an image Texture
         */ 

        const w : number = textureWidth;
        const h: number = textureHeight;
        const flowField : WebGLFlowField = this.compiledFilters.flowField;
        const etfSmoothVerticalPass : WebGLETFSmoothingPass = this.compiledFilters.etfSmoothingPass;
        const etfSmoothHorizontalPass : WebGLETFSmoothingPass = this.compiledFilters.etfSmoothingPass;
        
        // 
        const flowFieldFbo = flowField.render([inputTextures[0]], w, h);
        
        // 
        etfSmoothVerticalPass.setAttributes([0, 1], this.etfKernelSize);
        const etfSmoothVerticalPassFbo = etfSmoothVerticalPass.render([flowFieldFbo.getTexture()], w, h);
        this.framebufferPool.release(flowFieldFbo); // Flow field is not needed again

        //
        etfSmoothHorizontalPass.setAttributes([1, 0], this.etfKernelSize);
        const etfSmoothHorizontalPassFbo = etfSmoothHorizontalPass.render([etfSmoothVerticalPassFbo.getTexture()], w, h);
        this.framebufferPool.release(etfSmoothVerticalPassFbo); // etfSmoothVerticalPassFbo is not needed again

        return etfSmoothHorizontalPassFbo ;
    }
}

export default WebGLETF;