import WebGLCore from "../webGLCore";
import { RenderFilter } from '../ShaderCodes/postprocessingEffects/webGLRenderFilter';
import FramebufferPool from '../framebuffer_textures/framebufferPool';
import WebGLHistoryStack from "./webGLHistoryStack";


class WebGLRenderPipeline {
    public pipeline : RenderFilter[]= [];
    private wgl : WebGLCore; 
    private img : HTMLImageElement;
    public currentTex : WebGLTexture | null = null;
    private framebufferPool : FramebufferPool; 
    private historyStack : WebGLHistoryStack;

    constructor(wgl : WebGLCore, img : HTMLImageElement, framebufferPool: FramebufferPool, historyStack : WebGLHistoryStack) {
        this.wgl = wgl;
        this.img = img;
        this.framebufferPool = framebufferPool;
        this.historyStack = historyStack;


        // if (!this.wgl || !this.wgl.gl) return;
        // this.framebuffers = [ 
        //     new Framebuffer(this.wgl.gl, this.img.naturalWidth, this.img.naturalHeight), 
        //     new Framebuffer(this.wgl.gl, this.img.naturalWidth, this.img.naturalHeight)
        // ];
    }

    public setGlobalUniforms (program : WebGLProgram) {
        /* Setting the Post processing vertex uniforms based on the program */
        const gl = this.wgl.gl;
        if (!program) throw new Error("Failed to load program");
        if (!gl) throw new Error("Failed to find gl context")

        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        gl.uniform2f(resolutionLocation, this.img.naturalWidth, this.img.naturalHeight);
    }

    public addFilter(filter : RenderFilter) {
        /* Add the filter to the pipeline */ 
        this.pipeline.push(filter);
    }

    private clearPipeline() {
        this.pipeline.length = 0;
    }

    public renderPass (inputTex : WebGLTexture) {
        this.currentTex = inputTex;

        if (this.pipeline.length === 0) return ;
        const gl = this.wgl.gl;
        if (! gl ) throw new Error("WebGL context is null");
        let fbo;
        // Risk :  Possible error may occur
        try {
            
            for (const filter of this.pipeline) {
                
                if (!this.currentTex) break;
                
                fbo = filter.render([this.currentTex], this.img.naturalWidth, this.img.naturalHeight);
                this.currentTex = fbo.getTexture();
            }

        // Always run the below code regardless of the state of the outcomes in the loop 
        // (an error occurs, rendering completed, return is called early)
        // Ensures the pipeline state is always reset

        }finally {

            if (fbo)
            this.framebufferPool.release(fbo);

            if (this.framebufferPool.inUse.size > 0) {
                console.warn(this.framebufferPool.inUse.size + "framebuffers are currently in use. Check the pipeline");
            }
            
            this.clearPipeline();
        }
    }

    public getFinalFilter(){
        if (this.pipeline.length === 0) throw new Error("No filter in the pipeline");
        return this.pipeline[this.pipeline.length - 1];
    }
}

export default WebGLRenderPipeline;