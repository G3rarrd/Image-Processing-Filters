// import Framebuffer from '../framebuffer_textures/framebuffer';
import Texture from "../framebuffer_textures/texture";
import { imgFragmentShaderCode } from '../ShaderCodes/postprocessingEffects/imgFragmentShader';
import WebGLCore from "../webGLCore";
import WebGL2DCamera from './webGL2DCamera';
import WebGLCompileFilters from "../ShaderCodes/postprocessingEffects/webGLCompileFilters";
import WebGLRenderPipeline from "./webGLRenderPipeline";
import { cameraVertexShaderCode } from "../ShaderCodes/vertexShaders/cameraVertexShader";
import FramebufferPool from '../framebuffer_textures/framebufferPool';
import WebGLHistoryStack from "./webGLHistoryStack";

class WebGLRenderer {
    public wgl : WebGLCore;
    public gl : WebGL2RenderingContext;
    public program : WebGLProgram | null = null; // Scene Program
    public cam : WebGL2DCamera;
    // public flipY : number;
    public img : HTMLImageElement;
    public currentTexture : WebGLTexture;
    public holdCurrentTexture: WebGLTexture;
    public tex : Texture;
    public compiledFilters : WebGLCompileFilters;
    public renderPipeline : WebGLRenderPipeline;
    public framebufferPool : FramebufferPool;
    public historyStack : WebGLHistoryStack;

    
    constructor(
        gl : WebGL2RenderingContext,
        camera : WebGL2DCamera,
        img : HTMLImageElement
    ) {
        this.wgl = new WebGLCore(gl, gl.canvas.width, gl.canvas.height);
        this.framebufferPool = new FramebufferPool(gl);
        this.historyStack = new WebGLHistoryStack(this.wgl);
        this.renderPipeline = new WebGLRenderPipeline(this.wgl, img, this.framebufferPool);
        this.compiledFilters = new WebGLCompileFilters(this.wgl, this.framebufferPool);
        this.compiledFilters.initAll();
        
        this.gl = gl;
        this.cam = camera;
        // this.flipY = 1;
        this.img = img;
        this.tex = new Texture(gl);
        this.currentTexture = this.tex.createTextureFromImage(img);
        this.holdCurrentTexture = this.currentTexture;
        
        this.historyStack.add(this.currentTexture, this.img.naturalWidth, this.img.naturalHeight); // Ensures the 
        this.init();
        this.renderPipeline.renderPass(this.currentTexture);
    }

    
    
    // private setTextureUniforms(gl : WebGL2RenderingContext) {
    //     if (! this.program) return;
    //     const imgWidth : number = this.img.naturalWidth;
    //     const imgHeight : number = this.img.naturalHeight;
    //     this.tex.setUniforms(this.program, gl, imgWidth, imgHeight);
    // }


    public finalRenderUniforms () {
        /* Fragment shader uniform for the scene */ 

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number =0;
        if (!this.program) throw new Error("Failed to load program");

        const currentTextureLocation = gl.getUniformLocation(this.program, "u_image");
        gl.uniform1i(currentTextureLocation, TEX_NUM);
    }

    public init() {
        /* Setup the Renderer program and its */ 
        const gl  = this.wgl.gl;

        this.wgl.createQuadVAO(this.img.naturalWidth, this.img.naturalHeight);
        this.program = this.wgl.compileAndLinkProgram(cameraVertexShaderCode, imgFragmentShaderCode, 'Final Render');
        this.wgl.setupVAOAttributes(this.program);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    } 

    private setCameraUniforms() {
        /* Uniforms for the camera vertex shader */ 
        if (! this.cam) throw new Error("Camera is not available");
        if (! this.program) throw new Error("Program is not available");
        this.cam.setUniforms(this.program);
    }

    private drawToScreen(texture : WebGLTexture) {
        if (! this.program) throw new Error("No program is available for final rendering");
        
        const gl = this.wgl.gl;
        this.wgl.clearCanvas();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.wgl.clearCanvas();
    
        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        this.setCameraUniforms();
        this.finalRenderUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);   
    }


    public renderScene() {
        /* */ 
        this.drawToScreen(this.currentTexture);
    }

    

}

export default WebGLRenderer;