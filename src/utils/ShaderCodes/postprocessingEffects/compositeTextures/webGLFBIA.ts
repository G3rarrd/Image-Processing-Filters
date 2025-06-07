import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLFBL from "./WebGLFBL";
import WebGLFDoG from "./webGLFDoG";
import WebGLSuperImpose from "../nonCompositeTextures/webGLSuperImpose";

class WebGLFBIA implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly fdog : WebGLFDoG;
    private readonly fbl : WebGLFBL;
    private readonly superImpose : WebGLSuperImpose;
    private readonly framebufferPool : FramebufferPool;

    // FBL Attributes
    private iterationFBL : number = 1.0; 
    
    private sigmaE : number = 1.0;
    private rangeSigmaE : number = 1.0; 
    private sigmaG : number = 1.0;
    private rangeSigmaG : number = 1.0;
    private etfKernelSizeFBL : number = 3;
    private colorCount : number = 2; // For the quantization of the fbl output
    private spreadValue : number = 2; // For the quantization of the fbl output

    // FDoG Attributes
    private sigmaC : number = 1.6;
    private sigmaM : number = 1.5;
    private tau : number = 1.0;
    private etfKernelSizeFDoG : number = 3;
    private p : number = 1.0;
    private iterationFDoG : number = 1.0; 
    
    constructor (wgl:WebGLCore, framebufferPool : FramebufferPool) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.fdog = new WebGLFDoG(this.wgl, this.framebufferPool);
        this.fbl = new WebGLFBL(this.wgl, this.framebufferPool);
        this.superImpose = new WebGLSuperImpose(this.wgl);
    }

    public setAttributes (
        etfKernelSizeFBL : number, 
        sigmaE : number, 
        sigmaG : number, 
        rangeSigmaE : number, 
        rangeSigmaG : number, 
        iterationFBL : number,
        colorCount : number,
        spreadValue : number,

        etfKernelSizeFDoG : number,
        sigmaC : number,
        sigmaM : number,
        tau : number,
        p : number,
        iterationFDoG : number,
    ) {

        this.etfKernelSizeFBL = etfKernelSizeFBL;
        this.iterationFBL = iterationFBL;
        this.sigmaE = sigmaE;
        this.rangeSigmaE = rangeSigmaE;
        this.sigmaG = sigmaG;
        this.rangeSigmaG = rangeSigmaG;
        this.colorCount = colorCount;
        this.spreadValue = spreadValue;

        this.etfKernelSizeFDoG = etfKernelSizeFDoG;
        this.sigmaC = sigmaC;
        this.sigmaM = sigmaM;
        this.tau = tau;
        this.p = p;
        this.iterationFDoG = iterationFDoG;
    }
    
    public render(inputTextures : WebGLTexture[], fboPair : FramebufferPair) :WebGLTexture{
        /**

        */
        const fboWrite = fboPair.write();
        const fboRead = fboPair.read();

        const fboFDoG = this.framebufferPool.acquire(fboWrite.width, fboRead.height);
        
        const pairFDoG = new FramebufferPair(fboWrite, fboFDoG);
        this.fdog.setAttributes(this.sigmaC, this.sigmaM, this.etfKernelSizeFDoG, this.tau, this.p, this.iterationFDoG);
        const fdogTexture = this.fdog.render([inputTextures[0]],pairFDoG);

        const pairFBL = new FramebufferPair(pairFDoG.write(), fboRead);
        this.fbl.setAttributes(this.etfKernelSizeFBL, this.sigmaE, this.sigmaG, this.rangeSigmaE, this.rangeSigmaG, this.iterationFBL, this.colorCount, this.spreadValue);
        const fblTexture = this.fbl.render([inputTextures[0]], pairFBL);
        
        // Must still do some experiments regarding the superImpose class cause the frame buffer management right now is all over the place
        // Composite textures must be analyzed thoroughly in the future (FDoG (CLD), XDoG, FBIA, FBL, ETF) 
        // Will manage this for the mean time till i fully understand how to work with framebuffers properly
        const fboCombine = this.framebufferPool.acquire(fboWrite.width, fboRead.height);
        const combinePair = new FramebufferPair(fboCombine, pairFBL.read());
        
        const combineTextures = this.superImpose.render([fblTexture, fdogTexture],combinePair);
        
        this.framebufferPool.release(fboFDoG);
        return combineTextures;
    }
}

export default WebGLFBIA;