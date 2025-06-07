import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLEdgeBlurPass from "../nonCompositeTextures/webGLEdgeBlur";
import WebGLETF from "./webGLETF";
import WebGLGrayScale from "../nonCompositeTextures/webGLGrayscale";
import WebGLStreamlineBlur from "../nonCompositeTextures/webGLStreamlineBlur";
import WebGLTanhThreshold from "../nonCompositeTextures/WebGLTanhThreshold";
import WebGLSubtractFDoG from "../nonCompositeTextures/webGLSubtractFDoG";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import FramebufferPair from '../../../framebuffer_textures/framebufferPair';


class WebGLFDoG implements RenderFilter{
    private static readonly SCALAR : number = 1.6; // for sigmaS according to the paper
    private readonly wgl : WebGLCore;
    private readonly etf : WebGLETF;
    private readonly grayScale : WebGLGrayScale;
    private readonly edgeBlur : WebGLEdgeBlurPass;
    private readonly subtractFDoG : WebGLSubtractFDoG;
    private readonly  tanhThreshold : WebGLTanhThreshold;
    private readonly framebufferPool : FramebufferPool;
    private readonly streamlineBlur : WebGLStreamlineBlur;

    private p : number = 1.0;
    private sigmaS : number = 1.0;
    private sigmaC : number = 1.6;
    private sigmaM : number = 1.5;
    private tau : number = 1.0;
    private iteration : number = 0;
    private etfKernelSize : number = 3;
    
    constructor (wgl : WebGLCore, framebufferPool: FramebufferPool) {
        this.wgl = wgl;
        this.etf = new WebGLETF(this.wgl);
        this.edgeBlur = new WebGLEdgeBlurPass(this.wgl);
        this.subtractFDoG = new WebGLSubtractFDoG(this.wgl);
        this.streamlineBlur = new WebGLStreamlineBlur(this.wgl);
        this.grayScale = new WebGLGrayScale(this.wgl);
        this.tanhThreshold = new WebGLTanhThreshold(this.wgl); 
        this.framebufferPool =framebufferPool;
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

    public render(inputTextures : WebGLTexture[], fbos : FramebufferPair) : WebGLTexture{
        let fboWrite = fbos.write();
        const fboRead = fbos.read();

        const grayPair = new FramebufferPair(fboWrite, fboRead);
        const grayTexture = this.grayScale.render([inputTextures[0]], grayPair);
        
        // Get the Edge Tangent Flow of the image
        const fboETF = this.framebufferPool.acquire(fboWrite.width, fboWrite.height);
        this.etf.setAttributes(this.etfKernelSize);
        const pairETF = new FramebufferPair(grayPair.write(), fboETF);
        const etfTexture = this.etf.render([grayTexture],pairETF);

        const currentPair = new FramebufferPair(grayPair.write(), grayPair.read()); 
        let currentTexture = grayTexture;
        const fboEdgeBlur1 = this.framebufferPool.acquire(fboWrite.width, fboWrite.height);
        const fboEdgeBlur2 = this.framebufferPool.acquire(fboWrite.width, fboWrite.height);
        for (let i = 0; i < this.iteration; i++) {

            // Apply two distinct edge blurs of varying sigma sizes
            const pairEdgeBlur1 = new FramebufferPair(pairETF.write(), fboEdgeBlur1);
            this.edgeBlur.setAttributes(this.sigmaC);
            const edgeBlurTexture1 = this.edgeBlur.render([grayTexture , etfTexture], pairEdgeBlur1);
            fboWrite = pairEdgeBlur1.write();

            const pairEdgeBlur2 = new FramebufferPair(fboWrite , fboEdgeBlur2);
            this.edgeBlur.setAttributes(this.sigmaS);
            const edgeBlurTexture2 = this.edgeBlur.render([grayTexture , etfTexture], pairEdgeBlur2);
            fboWrite = pairEdgeBlur2.write();

            // Get the difference of gaussian of the two blurred textures
            const dogPair = new FramebufferPair(fboWrite, currentPair.read());
            this.subtractFDoG.setAttributes(this.p);
            const dogTexture = this.subtractFDoG.render([edgeBlurTexture1, edgeBlurTexture2], dogPair);

            // Apply a stream aligned blur on the difference of gaussian texture
            this.streamlineBlur.setAttributes(this.sigmaM);
            const streamlineBlurTexture = this.streamlineBlur.render([dogTexture, etfTexture],dogPair);

            // Apply a threshold to accentuate the edge lines
            this.tanhThreshold.setAttributes(this.tau);
            currentTexture = this.tanhThreshold.render([streamlineBlurTexture ],  dogPair);
        }

        this.framebufferPool.release(fboEdgeBlur1);
        this.framebufferPool.release(fboEdgeBlur2);
        this.framebufferPool.release(fboETF);

        return currentTexture;   
    }
}

export default WebGLFDoG;