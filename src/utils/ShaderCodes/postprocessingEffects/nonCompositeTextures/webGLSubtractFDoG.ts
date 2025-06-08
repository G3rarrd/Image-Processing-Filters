import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import Framebuffer from "../../../framebuffer_textures/framebuffer";

class WebGLSubtractFDoG implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    public program : WebGLProgram | null = null;
    private p : number = 1.0; // Variable name based on the paper
    constructor (
        wgl: WebGLCore,
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    public setAttributes(p : number) {
        this.p = p;
    }

    public init () : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSubtractFDoG.fragmentShader, "Subtract FDoG Shader");
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) : void  {
        const TEX_NUM : number = 0;
        const TEX_NUM_1 : number = 1;
        const U_IMAGE_1 : string = 'u_image_1';
        const U_IMAGE_2 : string = 'u_image_2';
        const U_P : string = 'u_p';
        
        const imageLocation1 : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE_1);
        const imageLocation2 : WebGLUniformLocation | null  = gl.getUniformLocation(program, U_IMAGE_2);
        const pLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_P);

        if (imageLocation1 === null) throw new Error(setUniformLocationError(U_IMAGE_1));
        if (imageLocation2 === null) throw new Error(setUniformLocationError(U_IMAGE_2));
        if (pLocation == null) throw new Error(setUniformLocationError(U_P))
        
        gl.uniform1i(imageLocation1, TEX_NUM);
        gl.uniform1i(imageLocation2, TEX_NUM_1);
        gl.uniform1f(pLocation, this.p);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer {
        /* Uses 2 textures */ 
        if (!this.program) throw new Error ("Subtract FDoG program is not compiled"); 
        
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
        uniform sampler2D u_image_1;
        uniform sampler2D u_image_2;
        uniform float u_p;

        in vec2 v_texCoord;
        out vec4 outColor; 

        void main() {
            vec4 color1 = texture(u_image_1, v_texCoord);
            vec4 color2 = texture(u_image_2, v_texCoord);

            vec3 subtract = vec3(color1) - (u_p * vec3(color2)) ;

            outColor = vec4(subtract, 1.0);
        }`
}

export default WebGLSubtractFDoG;