import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import WebGLShaderPass from "../webGLShaderPass";
import { RenderFilter } from "../webGLRenderFilter";

class WebGLSubtract implements RenderFilter {
    public program : WebGLProgram | null = null;
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool :FramebufferPool;
    constructor (
        wgl: WebGLCore,
        framebufferPool :FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSubtract.fragmentShader, "Subtract Shader");
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) : void {
        const imageLocation1 = gl.getUniformLocation(program, "u_image1");
        const imageLocation2 = gl.getUniformLocation(program, "u_image2");
        if (imageLocation1 === null || imageLocation2 === null) throw new Error("Failed to get uniform location for u_image1 or u_image2");
        gl.uniform1i(imageLocation1, 0);
        gl.uniform1i(imageLocation2, 1);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer {
        /* Uses 2 textures */ 
        if (! this.program) throw new Error("Subtract Program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }
    
    private static readonly fragmentShader = 
        `#version 300 es
        precision mediump float;
        uniform sampler2D u_image1;
        uniform sampler2D u_image2;
        in vec2 v_texCoord;
        out vec4 outColor; 

        void main() {
            vec4 color1 = texture(u_image1, v_texCoord);
            vec4 color2 = texture(u_image2, v_texCoord);

            vec3 subtract = vec3(color1) - vec3(color2) ;

            outColor = vec4(subtract, 1.0);
        }`
}

export default WebGLSubtract;