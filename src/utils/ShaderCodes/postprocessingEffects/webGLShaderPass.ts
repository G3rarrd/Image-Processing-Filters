import Framebuffer from "../../framebuffer_textures/framebuffer";
import FramebufferPair from "../../framebuffer_textures/framebufferPair";
import FramebufferPool from "../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../webGLCore";
import PostProcessingVertexShader from '../vertexShaders/postProcessingVertexShader';

class WebGLShaderPass {
    private readonly wgl: WebGLCore;
    private readonly postProcessing: PostProcessingVertexShader; 
    private readonly framebufferPool: FramebufferPool;
    private program: WebGLProgram;
    
    private setFragmentUniforms: ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | null = null;
    
    constructor (
        wgl: WebGLCore,
        program: WebGLProgram,
        framebufferPool: FramebufferPool,
        postProcessing : PostProcessingVertexShader,
        setFragmentUniforms : ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | null,
    ) {
        this.wgl = wgl;
        this.program = program;
        this.framebufferPool = framebufferPool;
        this.postProcessing = postProcessing;
        this.setFragmentUniforms = setFragmentUniforms;
    }

    public execute(inputTextures: WebGLTexture[], width: number, height: number) : Framebuffer {
    
        const gl: WebGL2RenderingContext = this.wgl.gl;
        const fboWrite : Framebuffer = this.framebufferPool.getWrite(width, height, inputTextures);
        const fboRead : Framebuffer = this.framebufferPool.getRead(width, height); 
        const fboPair : FramebufferPair = new FramebufferPair(fboWrite, fboRead);
        
        fboPair.write().bind(); // Enable the rendered image to be drawn on

        this.wgl.clearCanvas(); // Clear the framebuffer

        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);

        for (let i = 0; i < inputTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, inputTextures[i]);
        }

        this.postProcessing.setGlobalUniforms(gl, this.program,width, height);
        
        if (this.setFragmentUniforms) {
            this.setFragmentUniforms(gl, this.program);
        } else {
            console.error("Failed to add fragment shader uniforms")
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.useProgram(null);

        fboPair.write().unbind();
        fboPair.swap();
        
        this.framebufferPool.release(fboPair.write());
        
        return fboPair.read();
    }
}

export default WebGLShaderPass;