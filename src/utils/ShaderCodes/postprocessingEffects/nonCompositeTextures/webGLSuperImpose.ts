import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";

class WebGLSuperImpose implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    private program : WebGLProgram | null = null;
    constructor (
        wgl: WebGLCore,
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init () : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSuperImpose.fragmentShader, "Super Impose Shader");
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) : void {
        const TEX_NUM : number = 0;
        const TEX_NUM_1 : number = 1;

        const U_IMAGE : string = 'u_image';
        const U_FDoG : string = 'u_fdog';

        const imageLocation1 = gl.getUniformLocation(program, U_IMAGE);
        const imageLocation2 = gl.getUniformLocation(program, U_FDoG);

        if (!imageLocation1) throw new Error(setUniformLocationError(U_IMAGE))
        if (!imageLocation2) throw new Error(setUniformLocationError(U_FDoG))

        gl.uniform1i(imageLocation1, TEX_NUM);
        gl.uniform1i(imageLocation2, TEX_NUM_1);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer {
        /**
         * Uses 2 Textures
         * 
         * @param inputTextures[0] should be the image texture
         * @param inputTextures[1] should be fdog texture result
         * 
         * */ 
        
        if (!this.program) throw new Error("Super Impose Program is not compiled");

        
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
        uniform sampler2D u_image;
        uniform sampler2D u_fdog;
        in vec2 v_texCoord;
        out vec4 outColor; 

        void main() {
            vec4 imagePixelColor = texture(u_image, v_texCoord);
            vec4 fdogPixelColor = texture(u_fdog, v_texCoord); // most likely 1.0 or 0.0 rgb values

            vec3 finalColor = imagePixelColor.rgb;
            if (fdogPixelColor.r == 0.0) finalColor = vec3(0.0);

            outColor = vec4(finalColor, 1.0);
        }`
}

export default WebGLSuperImpose;