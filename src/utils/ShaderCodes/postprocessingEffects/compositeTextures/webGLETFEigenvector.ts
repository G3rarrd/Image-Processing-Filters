import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLGaussianBlur from './webGLGaussianBlur';
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";


class WebGLETFEigenvector implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly compiledFilters : WebGLCompileFilters;
    private readonly framebufferPool: FramebufferPool;
    private readonly gBlur : WebGLGaussianBlur;
    private sigmaC : number = 1.6;
    
    constructor (
        wgl:WebGLCore,
        compiledFilters : WebGLCompileFilters,
        framebufferPool: FramebufferPool

    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.compiledFilters = compiledFilters;
        this.gBlur = new WebGLGaussianBlur(this.wgl, this.compiledFilters, this.framebufferPool);
    }

    public setAttributes (sigmaC : number) {
        this.sigmaC = sigmaC;
    }
    
    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        // Step One: Create the Structured Tensor
        const w : number = textureWidth;
        const h : number = textureHeight;
        const structuredTensor = this.compiledFilters.structuredTensor;
        const eigenvector = this.compiledFilters.eigenvector;
        const gBlur = this.gBlur;
        
        const structuredTensorFbo = structuredTensor.render([inputTextures[0]], w, h);

        // Step two: Blur the Structured Tensor 
        gBlur.setAttributes(this.sigmaC);
        const blurStructuredTensorFbo = gBlur.render([structuredTensorFbo.getTexture()], w, h);
        this.framebufferPool.release(structuredTensorFbo) // structuredTensorFbo is no longer needed

        // Step three: Get the eigenvector and anisotropy of the structured tensor to get the edge tangent flow
        const etfFbo = eigenvector.render([blurStructuredTensorFbo.getTexture()], w, h);
        this.framebufferPool.release(blurStructuredTensorFbo) // blurStructuredTensorFbo is no longer needed
        
        return etfFbo;
    }
}

export default WebGLETFEigenvector;