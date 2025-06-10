import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLEdgeBlurPass from "../nonCompositeTextures/webGLEdgeBlur";
import WebGLGrayScale from "../nonCompositeTextures/webGLGrayscale";
import WebGLStreamlineBlur from "../nonCompositeTextures/webGLStreamlineBlur";
import WebGLXDoGThreshold from "../nonCompositeTextures/webGLXDoGThreshold";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";
import WebGLETFEigenvector from "./webGLETFEigenvector";
import { RangeSlidersProps } from "../../../../types/slider";

class WebGLXDoG implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly framebufferPool : FramebufferPool;
    private readonly compiledFilters : WebGLCompileFilters;
    private readonly etfEigenvector : WebGLETFEigenvector;
    private readonly k : number = 1.6; // Scalar for the second edge blur (sigma E * k )
    private sigmaE : number = 1.0;
    private sigmaC : number = 1.6
    private sigmaM : number = 1.0;
    private sigmaA : number = 1.0;
    private phi : number = 1.0;
    private epsilon : number = 0.9;
    private tau : number = 1.0;
    public config : RangeSlidersProps[];

    constructor (wgl : WebGLCore, framebufferPool: FramebufferPool, compiledFilters : WebGLCompileFilters) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.compiledFilters = compiledFilters;
        this.etfEigenvector = new WebGLETFEigenvector(this.wgl, this.compiledFilters, this.framebufferPool);
        this.config = [
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaE, label: "Radius E"},
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaC, label: "Radius C"},
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaM, label: "Radius M"},
            {min: 0.01, max: 60, step : 0.001, value: this.sigmaA, label: "Radius A"},
            {min: 0.01, max: 200, step : 0.01, value: this.tau, label: "Tau"},
            {min: 0.01, max: 1.0, step : 0.001, value: this.epsilon, label: "Epsilon"},
            {min: 0.01, max: 60, step : 0.01, value: this.phi, label: "Phi"},
        ]
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
        this.sigmaE = sigmaE;
        this.sigmaC = sigmaC; // Structured Tensor blur
        this.sigmaM = sigmaM;
        this.sigmaA = sigmaA;
        this.tau = tau;
        this.phi = phi;
        this.epsilon = epsilon;
    }   

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        const w : number = textureWidth;
        const h : number = textureHeight;
        const gray : WebGLGrayScale = this.compiledFilters.grayScale;
        const edgeBlur : WebGLEdgeBlurPass = this.compiledFilters.edgeBlurPass;
        const xDoGThreshold : WebGLXDoGThreshold = this.compiledFilters.xdogThreshold;
        const streamlineBlur : WebGLStreamlineBlur = this.compiledFilters.streamlineBlur;
        
        // Step One: Ensure the Texture is gray scaled
        const grayFbo = gray.render([inputTextures[0]], w, h);
        
        // Step Two: Get the Edge Tangent Flow of the gray scaled texture
        this.etfEigenvector.setAttributes(this.sigmaC);
        const etfFbo = this.etfEigenvector.render([inputTextures[0]], w, h);

        // Step Three: Implement a 1D blur across the edges
        edgeBlur.setAttributes(this.sigmaE);
        const edgeBlur1Fbo = edgeBlur.render([grayFbo.getTexture(), etfFbo.getTexture()], w, h);
        
        // Step Three: Implement a 1D blur across the edges
        edgeBlur.setAttributes(this.sigmaE * this.k);
        const edgeBlur2Fbo = edgeBlur.render([grayFbo.getTexture(), etfFbo.getTexture()], w, h);
        this.framebufferPool.release(grayFbo); // grayFbo is not needed again

        // Step Five: Subtract the 2 edge blurs
        xDoGThreshold.setAttributes(this.tau, this.epsilon, this.phi);
        const xDoGThresholdFbo = xDoGThreshold.render([edgeBlur1Fbo.getTexture(), edgeBlur2Fbo.getTexture()], w, h);
        // Both edgeBlur1Fbo and edgeBlur2Fbo are not needed
        this.framebufferPool.release(edgeBlur1Fbo);
        this.framebufferPool.release(edgeBlur2Fbo);

        // Step Six: Blur along the edge tangent flow (Similar to a line integral convolution)
        streamlineBlur.setAttributes(this.sigmaM);
        const streamlineBlur1Fbo = streamlineBlur.render([xDoGThresholdFbo.getTexture(), etfFbo.getTexture()], w, h);
        this.framebufferPool.release(xDoGThresholdFbo); // xDoGThreshold no longer needed

        streamlineBlur.setAttributes(this.sigmaA);
        const streamLineBlur2Fbo = streamlineBlur.render([streamlineBlur1Fbo.getTexture(), etfFbo.getTexture()], w, h); // Helps to remove anti aliasing
        this.framebufferPool.release(streamlineBlur1Fbo); // streamlineBlurFbo is no longer needed
        this.framebufferPool.release(etfFbo); // etfFbo is no longer needed

        return streamLineBlur2Fbo;
    }
}

export default WebGLXDoG;