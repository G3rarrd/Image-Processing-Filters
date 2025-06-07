import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLDithering from "../nonCompositeTextures/webGLDithering";
import WebGLETF from "./webGLETF";
import WebGLGradientAlignedBilateral from "../nonCompositeTextures/webGLGradientAlignedBilateralFilter";
import WebGLQuantization from "../nonCompositeTextures/webGLQuantization";
import WebGLStreamlineBilateral from "../nonCompositeTextures/webGLStreamLineBilateral";
import FramebufferPair from '../../../framebuffer_textures/framebufferPair';
class WebGLFBL implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly streamLineBilateral : WebGLStreamlineBilateral;
    private readonly gradientBilateral : WebGLGradientAlignedBilateral;
    private readonly etf : WebGLETF;
    private readonly quantization : WebGLQuantization;
    private readonly dithering : WebGLDithering;
    private readonly framebufferPool : FramebufferPool;
    private iteration : number = 1.0; 
    private sigmaE : number = 1.0;
    private rangeSigmaE : number = 1.0; 
    private sigmaG : number = 1.0;
    private rangeSigmaG : number = 1.0;
    private colorCount : number = 2; // Ensure the color count is base 2;
    private spreadValue : number = 2;
    private etfKernelSize : number = 3;

    constructor (wgl:WebGLCore, framebufferPool : FramebufferPool) {
        this.wgl = wgl;
        this.streamLineBilateral = new WebGLStreamlineBilateral(this.wgl);
        this.gradientBilateral = new WebGLGradientAlignedBilateral(this.wgl);
        this.etf = new WebGLETF(this.wgl);
        this.quantization = new WebGLQuantization(this.wgl);
        this.dithering = new WebGLDithering(this.wgl);
        this.framebufferPool = framebufferPool;
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
    
    public render(inputTextures : WebGLTexture[], fboPair : FramebufferPair) {
        /**

        */
        const fboWrite = fboPair.write();
        const fboRead = fboPair.read();
        const fboETF = this.framebufferPool.acquire(fboWrite.width, fboRead.height);

        // Get the Edge Tangent Flow of the Image
        const pairETF = new FramebufferPair(fboWrite, fboETF);
        this.etf.setAttributes(this.etfKernelSize);
        const etfTexture = this.etf.render([inputTextures[0]], pairETF);

        const pairCurrent = new FramebufferPair(pairETF.write(), fboRead);
        let currentTexture = inputTextures[0];
        for (let i = 0; i < this.iteration; i++) {
            // Performs a 1D bilateral filter along the streamline of the edge tangent flow
            this.streamLineBilateral.setAttributes(this.sigmaE, this.rangeSigmaE);
            const streamLineBilateralTexture = this.streamLineBilateral.render([currentTexture, etfTexture], pairCurrent);
            
            this.gradientBilateral.setAttribute(this.sigmaG, this.rangeSigmaG);
            const gradientBilateralTexture = this.gradientBilateral.render([streamLineBilateralTexture, etfTexture], pairCurrent);
            
            currentTexture = gradientBilateralTexture;
        }

        this.dithering.setAttributes(this.spreadValue, 'bayer8Luminance');
        const luminanceTexture = this.dithering.render([currentTexture], pairCurrent);
        
        this.quantization.setAttributes(this.colorCount)
        const quantizationTexture = this.quantization.render([luminanceTexture], pairCurrent);
        
        // this.framebufferPool.release(fboETF);
        return quantizationTexture;
    }
}

export default WebGLFBL;