import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLEigenvector from "../nonCompositeTextures/webGLEigenvector";
import WebGLGaussianBlur from "./webGLGaussianBlur";
import WebGLStructuredTensor from "../nonCompositeTextures/webGLStructuredTensor";
import FramebufferPair from '../../../framebuffer_textures/framebufferPair';


class WebGLETFEigenvector implements RenderFilter{
    private readonly wgl : WebGLCore;
    private sigmaC : number = 1.6;
    private gBlur : WebGLGaussianBlur;
    private structuredTensor : WebGLStructuredTensor;
    private eigenvector:WebGLEigenvector;
    
    constructor (wgl:WebGLCore) {
        this.wgl = wgl;
        this.gBlur = new WebGLGaussianBlur(this.wgl);
        this.eigenvector = new WebGLEigenvector(this.wgl);
        this.structuredTensor = new WebGLStructuredTensor(this.wgl);
    }

    public setAttributes (sigmaC : number) {
        this.sigmaC = sigmaC;
    }
    
    public render(inputTextures : WebGLTexture[], fboPair : FramebufferPair) : WebGLTexture {
        // const gl = this.wgl.gl;
        let fboWrite = fboPair.write();
        let fboA = fboPair.read();

        const pairA = new FramebufferPair(fboWrite, fboA);
        // Step One: Create the Structured Tensor
        const structuredTensorTexture = this.structuredTensor.render([inputTextures[0]], pairA);

        // Step two: Blur the Structured Tensor 
        this.gBlur.setAttributes(this.sigmaC);
        const blurStructuredTensorTexture = this.gBlur.render([structuredTensorTexture], pairA);

        // Step three: Get the eigenvalue of the structured tensor to get the edge tangent flow
        const etfTexture = this.eigenvector.render([blurStructuredTensorTexture], pairA);
        [fboWrite, fboA] = [fboA, fboWrite];

        return etfTexture;
    }
}

export default WebGLETFEigenvector;