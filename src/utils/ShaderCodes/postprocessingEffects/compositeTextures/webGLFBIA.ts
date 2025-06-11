import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLFBL from "./WebGLFBL";
import WebGLFDoG from "./webGLFDoG";
import WebGLSuperImpose from "../nonCompositeTextures/webGLSuperImpose";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";
import { RangeSlidersProps } from "../../../../types/slider";

class WebGLFBIA implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly fdog : WebGLFDoG;
    private readonly fbl : WebGLFBL;
    private readonly framebufferPool : FramebufferPool;
    private readonly compiledFilters : WebGLCompileFilters;

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

    public config : RangeSlidersProps[];
    
    
    constructor (
        wgl:WebGLCore, 
        framebufferPool : FramebufferPool, 
        compiledFilters : WebGLCompileFilters
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.compiledFilters = compiledFilters ;
        this.fdog = new WebGLFDoG(this.wgl, this.framebufferPool, compiledFilters);
        this.fbl = new WebGLFBL(this.wgl, this.framebufferPool, compiledFilters);
    
        this.config = [
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaS, label: "Radius E"},
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaC, label: "Radius C"},
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaM, label: "Radius M"},
            {min: 3, max: 21, step : 2, value: this.etfKernelSizeFDoG, label: "ETF Kernel Size FDoG"},
            {min: 0.9, max: 1, step : 0.0001, value: this.tau, label: "Tau"},
            {min: 1, max: 5, step : 1, value: this.iterationFDoG, label: "Iteration FDoG"},
            {min: 0.8, max: 1.0, step : 0.0001, value: this.p, label: "P"},
        ]
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
    
    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
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