import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLETFSmoothingPass from "../nonCompositeTextures/webGLETFSmoothingPass";
import WebGLFlowField from "../nonCompositeTextures/webGLFlowField";


class WebGLETF implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly flowField : WebGLFlowField;
    private readonly etfSmoothVerticalPass : WebGLETFSmoothingPass;
    private readonly etfSmoothHorizontalPass : WebGLETFSmoothingPass;
    private  etfKernelSize : number = 3;

    constructor (wgl:WebGLCore) {
        this.wgl = wgl;
        this.flowField = new WebGLFlowField(this.wgl);
        this.etfSmoothHorizontalPass = new WebGLETFSmoothingPass(this.wgl);
        this.etfSmoothVerticalPass = new WebGLETFSmoothingPass(this.wgl);
    }

    public setAttributes (etfKernelSize : number) {
        this.etfKernelSize = etfKernelSize;
    }
    
    public render(inputTextures : WebGLTexture[],fboPair : FramebufferPair) : WebGLTexture{
        const flowFieldTexture = this.flowField.render([inputTextures[0]], fboPair);
        
        this.etfSmoothVerticalPass.setAttributes([0, 1], this.etfKernelSize);
        const etfSmoothVerticalPassTexture = this.etfSmoothVerticalPass.render([flowFieldTexture], fboPair);

        this.etfSmoothHorizontalPass.setAttributes([1, 0], this.etfKernelSize);
        const etfSmoothHorizontalPassTexture = this.etfSmoothHorizontalPass.render([etfSmoothVerticalPassTexture], fboPair);
        
        return   etfSmoothHorizontalPassTexture ;
    }
}

export default WebGLETF;