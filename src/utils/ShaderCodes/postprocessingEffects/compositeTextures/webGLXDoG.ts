import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLEdgeBlurPass from "../nonCompositeTextures/webGLEdgeBlur";
import WebGLGrayScale from "../nonCompositeTextures/webGLGrayscale";
import WebGLStreamlineBlur from "../nonCompositeTextures/webGLStreamlineBlur";
import WebGLETFEigenvector from "./webGLETFEigenvector";
import WebGLXDoGThreshold from "../nonCompositeTextures/webGLXDoGThreshold";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';

class WebGLXDoG implements RenderFilter{
    private wgl : WebGLCore;
    private readonly etf: WebGLETFEigenvector;
    private readonly edgeBlur: WebGLEdgeBlurPass;
    private readonly grayScale: WebGLGrayScale;
    private readonly xDoGThreshold: WebGLXDoGThreshold;
    private readonly streamLineBlur: WebGLStreamlineBlur;
    private readonly framebufferPool : FramebufferPool;
    private sigmaC : number = 1.0;
    private sigmaE : number = 1.0;
    private sigmaM : number = 1.0;
    private sigmaA : number = 1.0;
    private scalar : number = 1.6;
    private phi : number = 1.0;
    private epsilon : number = 0.9;
    private tau : number = 1.0;

    constructor (wgl : WebGLCore, framebufferPool: FramebufferPool) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.etf = new WebGLETFEigenvector(this.wgl);
        this.edgeBlur = new WebGLEdgeBlurPass(this.wgl);
        this.grayScale = new WebGLGrayScale(this.wgl);
        this.streamLineBlur = new WebGLStreamlineBlur(this.wgl);
        this.xDoGThreshold = new WebGLXDoGThreshold(this.wgl);
    }

    public setAttributes(
        sigmaC : number, 
        sigmaE : number, 
        sigmaM : number, 
        sigmaA : number,
        tau : number,
        phi : number,
        epsilon : number,
    ) {
        this.sigmaC = sigmaC;
        this.sigmaE = sigmaE;
        this.sigmaM = sigmaM;
        this.sigmaA = sigmaA;
        this.tau = tau;
        this.phi = phi;
        this.epsilon = epsilon;
    }   

    public render(inputTextures : WebGLTexture[], fboPair : FramebufferPair) : WebGLTexture {
        const fboWrite = fboPair.write(); 
        const fboRead = fboPair.read();
        const fboEdgeBlur1 = this.framebufferPool.acquire(fboWrite.width, fboWrite.height);
        const fboEdgeBlur2 = this.framebufferPool.acquire(fboWrite.width, fboWrite.height);
        
        // Step One: Ensure the Texture is gray scaled
        const fboPairGray = new FramebufferPair(fboWrite, fboRead);
        const grayTexture = this.grayScale.render([inputTextures[0]], fboPairGray);
        
        // Step Two: Get the Edge Tangent Flow of the gray scaled texture
        const fboETF = this.framebufferPool.acquire(fboWrite.width, fboWrite.height);
        const fboPairETF = new FramebufferPair(fboPairGray.write(), fboETF);
        this.etf.setAttributes(this.sigmaC);
        const etfTexture = this.etf.render([grayTexture], fboPairETF);

        // Step Three: Implement a 1D blur across the edges
        const fboPairEdgeBlur1 = new FramebufferPair(fboPairETF.write(), fboEdgeBlur1);
        this.edgeBlur.setAttributes(this.sigmaE);
        const edgeBlurTexture1 = this.edgeBlur.render([grayTexture, etfTexture], fboPairEdgeBlur1);
        
        // Step Three: Implement a 1D blur across the edges
        const fboPairEdgeBlur2 = new FramebufferPair(fboPairEdgeBlur1.write(), fboEdgeBlur2);
        this.edgeBlur.setAttributes(this.sigmaE * this.scalar);
        const edgeBlurTexture2 = this.edgeBlur.render([grayTexture, etfTexture], fboPairEdgeBlur2);

        // Step Five: Subtract the 2 edge blurs
        const fboDogPair = new FramebufferPair(fboPairEdgeBlur2.write(), fboPairGray.read())
        this.xDoGThreshold.setAttributes(this.tau, this.epsilon, this.phi);
        const dogTexture = this.xDoGThreshold.render([edgeBlurTexture1, edgeBlurTexture2], fboDogPair);
        
        // Step Six: Blur along the edge tangent flow (Similar to a line integral convolution)
        this.streamLineBlur.setAttributes(this.sigmaM);
        const streamLineBlur1Texture = this.streamLineBlur.render([dogTexture, etfTexture],fboDogPair);

        this.streamLineBlur.setAttributes(this.sigmaA);
        const streamLineBlur2Texture = this.streamLineBlur.render([streamLineBlur1Texture, etfTexture], fboDogPair); // Helps to remove anti aliasing
        
        this.framebufferPool.release(fboETF);
        this.framebufferPool.release(fboEdgeBlur1);
        this.framebufferPool.release(fboEdgeBlur2);

        return streamLineBlur2Texture;
    }
}

export default WebGLXDoG;