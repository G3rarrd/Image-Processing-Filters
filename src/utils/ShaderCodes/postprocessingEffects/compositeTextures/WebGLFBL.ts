import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLETF from "./webGLETF";
import WebGLCompileFilters from "../webGLCompileFilters";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLStreamlineBilateral from "../nonCompositeTextures/webGLStreamLineBilateral";
import WebGLDithering from "../nonCompositeTextures/webGLDithering";
import WebGLQuantization from "../nonCompositeTextures/webGLQuantization";
import WebGLGradientAlignedBilateral from "../nonCompositeTextures/webGLGradientAlignedBilateralFilter";
import { RangeSlidersProps } from "../../../../types/slider";
class WebGLFBL implements RenderFilter{
    private readonly wgl : WebGLCore;

    private readonly etf : WebGLETF;

    private readonly compiledFilters : WebGLCompileFilters;

    private readonly framebufferPool : FramebufferPool;
    private iteration : number = 1.0; 
    private sigmaE : number = 1.0;
    private rangeSigmaE : number = 1.0; 
    private sigmaG : number = 1.0;
    private rangeSigmaG : number = 1.0;
    private colorCount : number = 2; // Ensure the color count is base 2;
    private spreadValue : number = 0.05;
    private etfKernelSize : number = 3;
    public config : RangeSlidersProps[];
    constructor (wgl:WebGLCore, framebufferPool : FramebufferPool, compiledFilters : WebGLCompileFilters) {
        this.wgl = wgl;
        this.compiledFilters = compiledFilters;
        this.etf = new WebGLETF(this.wgl, compiledFilters, framebufferPool);
        this.framebufferPool = framebufferPool;
        this.config = [
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaE, label: "Radius E"},
            {min: 0.01, max: 60, step : 0.001, value: this.rangeSigmaE, label: "Range Radius E"},
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaG, label: "Radius G"},
            {min: 0.01, max: 60, step : 0.001, value: this.rangeSigmaG, label: "Range Radius G"},
            {min: 3, max: 21, step : 2, value: this.etfKernelSize, label: "ETF Kernel Size"},
            {min: 2, max: 255, step : 1, value: this.colorCount,label: "Color Count"},
            {min: 1, max: 5, step : 1, value: this.iteration, label: "Iteration"},
            {min: 0.01,max: 5,step : 0.001,value: this.spreadValue,label: "Spread Value"},
        ]
    }

    public setAttributes (
        etfKernelSize : number, 
        sigmaE : number, 
        sigmaG : number, 
        rangeSigmaE : number, 
        rangeSigmaG : number, 
        iteration : number,
        colorCount : number,
        spreadValue : number
    ) {
        this.iteration = iteration;
        this.sigmaE = sigmaE;
        this.rangeSigmaE = rangeSigmaE;
        this.sigmaG = sigmaG;
        this.rangeSigmaG = rangeSigmaG;
        this.etfKernelSize = etfKernelSize;
        this.colorCount = colorCount;
        this.spreadValue = spreadValue;
    }
    
    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        /**

        */

        const w : number = textureWidth;
        const h : number = textureHeight;
        const streamLineBilateral : WebGLStreamlineBilateral = this.compiledFilters.streamlineBilateral;
        const gradientBilateral : WebGLGradientAlignedBilateral = this.compiledFilters.gradientAlignedBilateral;
        const dithering : WebGLDithering = this.compiledFilters.dithering;
        const quantization : WebGLQuantization = this.compiledFilters.quantization;
        
        // Get the Edge Tangent Flow of the Image
        this.etf.setAttributes(this.etfKernelSize);
        const etfFbo : Framebuffer = this.etf.render([inputTextures[0]], w, h);

        let currentTexture : WebGLTexture = inputTextures[0];
        let gradientBilateralFbo : Framebuffer | undefined;
        for (let i = 0; i < this.iteration; i++) {
            // Performs a 1D bilateral filter along the streamline of the edge tangent flow
            streamLineBilateral.setAttributes(this.sigmaE, this.rangeSigmaE);
            const streamLineBilateralFbo : Framebuffer = streamLineBilateral.render([currentTexture, etfFbo.getTexture()], w, h);
            
            // Releases the previous gradientBilateral Fbo 
            if (gradientBilateralFbo) {
                this.framebufferPool.release(gradientBilateralFbo);
            }
            
            gradientBilateral.setAttribute(this.sigmaG, this.rangeSigmaG);
            gradientBilateralFbo = gradientBilateral.render([streamLineBilateralFbo.getTexture(), etfFbo.getTexture()], w, h);
            this.framebufferPool.release(streamLineBilateralFbo);

            currentTexture = gradientBilateralFbo.getTexture();
        }

        

        this.framebufferPool.release(etfFbo); // Etf fbo no longer needed

        dithering.setAttributes(this.spreadValue, 4); // 4 stands for bayer8Luminance which is used according to the paper
        const luminanceFbo = dithering.render([currentTexture], w, h);
        
        // gradientBilateral Fbo (used at the current texture) is no longer needed
        if (gradientBilateralFbo) this.framebufferPool.release(gradientBilateralFbo);

        quantization.setAttributes(this.colorCount)
        const quantizationFbo = quantization.render([luminanceFbo.getTexture()],w, h);
        
        this.framebufferPool.release(luminanceFbo);

        return quantizationFbo;
    }
}
export default WebGLFBL;