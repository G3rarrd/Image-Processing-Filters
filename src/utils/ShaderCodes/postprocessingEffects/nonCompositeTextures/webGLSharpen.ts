import { RenderFilter } from "../webGLRenderFilter";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLShaderPass from "../webGLShaderPass";
class WebGLSharpen implements RenderFilter{
    private readonly framebufferPool: FramebufferPool;
    private readonly wgl : WebGLCore;
    public program : WebGLProgram | null = null;
    private postProcessing : PostProcessingVertexShader;
    constructor (
        wgl: WebGLCore, 
        framebufferPool: FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    private sharpen : number[] = 
    [
        0, -1, 0, 
        -1, 5, -1, 
        0, -1, 0
    ]

    public init () {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSharpen.fragmentShader, "Sharpen Shader");
    }

    private setUniforms  (gl: WebGL2RenderingContext, program: WebGLProgram)  {
        const TEX_NUM : number = 0;

        const U_IMAGE : string = "u_image";
        const U_KERNEL : string = "u_kernel";
        const U_KERNEL_WEIGHT : string = "u_kernel_weight";

        const imageLocation: WebGLUniformLocation | null = gl.getUniformLocation(program,U_IMAGE);
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(program,U_KERNEL);
        const kernelWeightLocation : WebGLUniformLocation | null = gl.getUniformLocation(program,  U_KERNEL_WEIGHT);
        
        if (! imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (! kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (! kernelWeightLocation) throw new Error(setUniformLocationError(U_KERNEL_WEIGHT));
        
        const kernelWeight = this.sharpen.reduce((acc, val) => acc + val, 0);
        
        gl.uniform1f(kernelWeightLocation, kernelWeight)
        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1fv(kernelLocation, this.sharpen);
    };

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Sharpen program is not compiled");
        
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
        uniform float u_kernel[9];
        uniform float u_kernel_weight;

        in vec2 v_texCoord;

        out vec4 outColor;

        void main() {
            vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

            vec4 colorSum =     
            texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] + 
            texture(u_image, v_texCoord + onePixel * vec2(0, -1)) * u_kernel[1] + 
            texture(u_image, v_texCoord + onePixel * vec2(1, -1)) * u_kernel[2] +
            texture(u_image, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel[3] +
            texture(u_image, v_texCoord + onePixel * vec2(0, 0)) * u_kernel[4] +
            texture(u_image, v_texCoord + onePixel * vec2(1, 0)) * u_kernel[5] +
            texture(u_image, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[6] +
            texture(u_image, v_texCoord + onePixel * vec2(0, 1)) * u_kernel[7] +
            texture(u_image, v_texCoord + onePixel * vec2(1, 1)) * u_kernel[8];
            vec3 color = colorSum.rgb;

            if (u_kernel_weight != 0.0) color /= u_kernel_weight;
            
            outColor = vec4(color, 1.0);
        }`
}

export default WebGLSharpen;