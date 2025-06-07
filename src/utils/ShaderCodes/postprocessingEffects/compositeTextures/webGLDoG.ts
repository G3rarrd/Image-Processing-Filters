import WebGLCore from "../../../webGLCore";
import WebGLGaussianBlur from "./webGLGaussianBlur";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLSubtract from "../nonCompositeTextures/webGLSubtract";
import WebGLBinaryThreshold from "../nonCompositeTextures/webGLBinaryThresholding";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLDoG implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly binaryThreshold : WebGLBinaryThreshold;
    private readonly gaussianBlur : WebGLGaussianBlur;
    private readonly subtract : WebGLSubtract;

    private sigma : number;
    private scalar : number = 1.6;
    private threshold : number = 0.01;

    constructor (wgl : WebGLCore, sigma : number) {
        this.wgl = wgl;
        this.sigma = sigma;
        this.binaryThreshold = new WebGLBinaryThreshold(this.wgl);
        this.gaussianBlur = new WebGLGaussianBlur(this.wgl);
        this.subtract = new WebGLSubtract(this.wgl);
    }

    public setAttributes (sigma : number, threshold : number, scalar : number) {
        this.sigma = sigma;
        this.threshold = threshold;
        this.scalar = scalar
    }

    public render(inputTextures : WebGLTexture[], fboPair : FramebufferPair) : WebGLTexture {
        // const gl = this.wgl.gl;
        let fboWrite =fboPair.write();
        let fboRead = fboPair.read();

        // Apply 2 gaussian blurs of varying sigmas 
        this.gaussianBlur.setAttributes(this.sigma);
        const gBlurTexture1 = this.gaussianBlur.render([inputTextures[0]], fboPair);
        [fboWrite, fboRead] = [fboRead, fboWrite];

        this.gaussianBlur.setAttributes(this.sigma * this.scalar);
        const gBlurTexture2 = this.gaussianBlur.render([inputTextures[0]], fboPair);
        [fboWrite, fboRead] = [fboRead, fboWrite];

        // Get the difference of the 2 gaussian blurs;
        const subtractTexture = this.subtract.render([gBlurTexture1, gBlurTexture2], fboPair);
        [fboWrite, fboRead] = [fboRead, fboWrite];

        // Apply a binary threshold to extract the edges of the difference blur
        this.binaryThreshold.setAttributes(this.threshold);
        const dogTexture = this.binaryThreshold.render([subtractTexture], fboPair);
        [fboWrite, fboRead] = [fboRead, fboWrite];

        return dogTexture;
    }
}

export default WebGLDoG;