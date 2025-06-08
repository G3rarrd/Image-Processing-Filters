import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLETF from "./webGLETF";
import WebGLGrayScale from "../nonCompositeTextures/webGLGrayscale";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";


class WebGLFDoG implements RenderFilter{
    private static readonly SCALAR : number = 1.6; // for sigmaS according to the paper
    private readonly wgl : WebGLCore;
    private readonly compiledFilters : WebGLCompileFilters;
    private readonly framebufferPool : FramebufferPool;

    private etf : WebGLETF;
    private p : number = 1.0;
    private sigmaS : number = 1.0;
    private sigmaC : number = 1.6;
    private sigmaM : number = 1.5;
    private tau : number = 1.0;
    private iteration : number = 0;
    private etfKernelSize : number = 3;
    
    constructor (
        wgl : WebGLCore,
        framebufferPool: FramebufferPool,
        compiledFilters : WebGLCompileFilters
    ) {
        this.wgl = wgl;
        this.framebufferPool =framebufferPool;
        this.compiledFilters = compiledFilters;
        this.etf = new WebGLETF(this.wgl, this.compiledFilters, this.framebufferPool);
    }

    public setAttributes(
        sigmaC : number, 
        sigmaM : number, 
        etfKernelSize : number, 
        tau : number, 
        p : number,
        iteration : number
    ) : void {
        this.p = p;
        this.sigmaS = sigmaC * WebGLFDoG.SCALAR;
        this.tau = tau;
        this.etfKernelSize = etfKernelSize;
        this.sigmaM = sigmaM;
        this.iteration = iteration;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        const w : number = textureWidth;
        const h : number = textureHeight;
        const gray : WebGLGrayScale = this.compiledFilters.grayScale;
        const edgeBlur = this.compiledFilters.edgeBlurPass;
        const subtractFDoG = this.compiledFilters.subtractFDoG;
        const streamlineBlur = this.compiledFilters.streamlineBlur;
        const tanhThreshold = this.compiledFilters.tanhThreshold;
        const superImpose = this.compiledFilters.superImpose;

        const grayFbo = gray.render([inputTextures[0]], w, h);

        // Get the Edge Tangent Flow of the image
        const etfFbo = this.etf.render([inputTextures[0]], w, h);
        
        let currentFbo = grayFbo;
        for (let i = 0; i < this.iteration; i++) {
            // Apply two distinct edge blurs of varying sigma sizes
            edgeBlur.setAttributes(this.sigmaC);
            const edgeBlur1Fbo = edgeBlur.render([currentFbo.getTexture() , etfFbo.getTexture()], w, h);

            edgeBlur.setAttributes(this.sigmaS);
            const edgeBlur2Fbo  = edgeBlur.render([currentFbo.getTexture() , etfFbo.getTexture()], w, h);

            // Get the difference of gaussian of the two blurred textures
            subtractFDoG.setAttributes(this.p);
            const subtractFDoGFbo = subtractFDoG.render([edgeBlur1Fbo.getTexture(), edgeBlur2Fbo.getTexture()],  w, h);
            // Edge Blur 1 and 2 fbos are not needed again for this iteration
            this.framebufferPool.release(edgeBlur1Fbo); 
            this.framebufferPool.release(edgeBlur2Fbo);
            
            // Apply a stream aligned blur on the difference of gaussian texture
            streamlineBlur.setAttributes(this.sigmaM);
            const streamlineBlurFbo = streamlineBlur.render([subtractFDoGFbo.getTexture(), etfFbo.getTexture()], w, h);
            this.framebufferPool.release(subtractFDoGFbo) // subtractFDoGFbo is not needed again for this iteration

            // Apply a threshold to accentuate the edge lines
            tanhThreshold.setAttributes(this.tau);
            const tanhThresholdFbo = tanhThreshold.render([streamlineBlurFbo.getTexture()], w, h);
            this.framebufferPool.release(streamlineBlurFbo) // streamLineBlurFbo is not needed for this iteration
            
            if (i !== this.iteration - 1){
                const superImposeFbo = superImpose.render([currentFbo.getTexture(), tanhThresholdFbo.getTexture()], w, h);
                this.framebufferPool.release(tanhThresholdFbo) // tanhThresholdFbo is not needed again for this iteration
                this.framebufferPool.release(currentFbo); // The current fbo at the start of the iteration is not in use again
                currentFbo = superImposeFbo;
            } else {
                this.framebufferPool.release(currentFbo);
                currentFbo = tanhThresholdFbo;
            }
            
            
        }
        this.framebufferPool.release(etfFbo);

        return currentFbo;   
    }
}

export default WebGLFDoG;