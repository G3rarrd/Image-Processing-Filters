import GaussianCalculations from "../../../math/gaussianCalculation";
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLGaussianBlurPass from "../nonCompositeTextures/webGLGaussianBlurPass";
import FramebufferPair from '../../../framebuffer_textures/framebufferPair';

class WebGLGaussianBlur implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly blur : WebGLGaussianBlurPass;
    private sigma : number = 1.6;
    private kernelSize : number = 3;
    private gaussianCalc : GaussianCalculations;
    private kernel1D : number[] = [0, 1, 0];

    constructor (wgl:WebGLCore) {
        this.wgl = wgl;
        this.gaussianCalc = new GaussianCalculations();
        this.blur = new WebGLGaussianBlurPass(this.wgl);
    }

    public setAttributes(sigma : number) {
        this.sigma = sigma;
        this.kernelSize = this.gaussianCalc.getKernelSize(this.sigma);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(this.kernelSize, sigma) ;
    }
    
    public render(inputTextures : WebGLTexture[], fboPair: FramebufferPair) {
        /**

        */

        if (this.sigma < 0.01) return inputTextures[0];

        const fboWrite = fboPair.write();
        const fboA = fboPair.read();

        const pairA = new FramebufferPair(fboWrite, fboA);

        this.blur.setAttributes(this.kernel1D, [0, 1]);
        const pass1 = this.blur.render([inputTextures[0]], pairA);

        this.blur.setAttributes(this.kernel1D, [1, 0]);
        const pass2 = this.blur.render([pass1], pairA);
        
        return pass2;
    }
}

export default WebGLGaussianBlur;