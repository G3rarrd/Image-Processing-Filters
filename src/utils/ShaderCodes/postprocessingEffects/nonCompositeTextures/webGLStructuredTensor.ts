import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import Framebuffer from "../../../framebuffer_textures/framebuffer";

class WebGLStructuredTensor implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    private program: WebGLProgram | null = null; 
    
    constructor (
        wgl:WebGLCore, 
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader(); 
        this.framebufferPool = framebufferPool;  
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLStructuredTensor.fragmentShader, "Structured Tensor Shader");
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (! this.program) throw new Error ("Structured Tensor Program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms (gl: WebGL2RenderingContext, program: WebGLProgram) : void {
        const TEX_NUM : number = 0;
        const U_IMAGE : string = "u_image";

        const imageLocation = gl.getUniformLocation(program, U_IMAGE);
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));

        gl.uniform1i(imageLocation, TEX_NUM);
    };

    /**
     * Ensure the image is a gray scale before using this shader for best results
     * */ 
    private static readonly fragmentShader = 
    `#version 300 es
    precision highp float;
    
    uniform sampler2D u_image;
    
    in vec2 v_texCoord;
    
    out vec4 outColor;

    void main () {

        vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

        vec4 colorSumX =     
        texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) *  1.0 + 
        texture(u_image, v_texCoord + onePixel * vec2(0, -1)) * 2.0 + 
        texture(u_image, v_texCoord + onePixel * vec2(1, -1)) * 1.0 +
        texture(u_image, v_texCoord + onePixel * vec2(-1, 0)) * 0.0 +
        texture(u_image, v_texCoord + onePixel * vec2(0, 0)) * 0.0 +
        texture(u_image, v_texCoord + onePixel * vec2(1, 0)) * 0.0 +
        texture(u_image, v_texCoord + onePixel * vec2(-1, 1)) * -1.0 +
        texture(u_image, v_texCoord + onePixel * vec2(0, 1)) * -2.0 +
        texture(u_image, v_texCoord + onePixel * vec2(1, 1)) * -1.0 ;
        
        vec4 colorSumY =     
        texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) *  1.0 + 
        texture(u_image, v_texCoord + onePixel * vec2(0, -1)) * 0.0 + 
        texture(u_image, v_texCoord + onePixel * vec2(1, -1)) * -1.0 +
        texture(u_image, v_texCoord + onePixel * vec2(-1, 0)) * 2.0 +
        texture(u_image, v_texCoord + onePixel * vec2(0, 0)) * 0.0 +
        texture(u_image, v_texCoord + onePixel * vec2(1, 0)) * -2.0 +
        texture(u_image, v_texCoord + onePixel * vec2(-1, 1)) * 1.0 +
        texture(u_image, v_texCoord + onePixel * vec2(0, 1)) * 0.0 +
        texture(u_image, v_texCoord + onePixel * vec2(1, 1)) * -1.0;

        // Structured Tensor;
        float xx = dot(colorSumX.rgb, colorSumX.rgb);
        float xy = dot(colorSumX.rgb, colorSumY.rgb);
        float yy = dot(colorSumY.rgb, colorSumY.rgb);

        // Output structured Tensor
        outColor = vec4(xx, yy, xy, 1.0);
    }`;
}

export default WebGLStructuredTensor;
