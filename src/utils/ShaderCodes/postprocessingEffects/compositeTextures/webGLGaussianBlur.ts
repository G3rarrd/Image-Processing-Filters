import GaussianCalculations from "../../../math/gaussianCalculation";
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';

class WebGLGaussianBlur implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly compiledFilters : WebGLCompileFilters;
    private readonly framebufferPool: FramebufferPool;
    private sigma : number = 1.6;
    private kernelSize : number = 3;
    private gaussianCalc : GaussianCalculations;
    private kernel1D : number[] = [0, 1, 0];

    constructor (
        wgl:WebGLCore,
        compiledFilters : WebGLCompileFilters,
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.gaussianCalc = new GaussianCalculations();
        this.compiledFilters = compiledFilters;
    }

    public setAttributes(sigma : number) {
        this.sigma = sigma;
        this.kernelSize = this.gaussianCalc.getKernelSize(this.sigma);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(this.kernelSize, sigma) ;
    }
    
    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        /**
         * Uses 1 input Texture
         * @param inputTextures[0] is an image texture
        */
        const w : number = textureWidth;
        const h : number = textureHeight;
        const gblurPass = this.compiledFilters.gaussianBlurPass;

        gblurPass.setAttributes(this.kernel1D, [0, 1]);
        const pass1Fbo = gblurPass.render([inputTextures[0]], w, h);


        gblurPass.setAttributes(this.kernel1D, [1, 0]);
        const finalPassFbo = gblurPass.render([pass1Fbo.getTexture()], w, h);
        this.framebufferPool.release(pass1Fbo) // pass1Fbo is not needed again

        return finalPassFbo;
    }
}

export default WebGLGaussianBlur;