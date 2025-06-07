import { RenderFilter } from "../webGLRenderFilter";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
class WebGLSobel implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program : WebGLProgram | null = null;

    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    private sobelX : number[] = 
    [
        1, 0, -1, 
        2, 0, -2,
        1, 0, -1
    ]

    private sobelY : number[] = 
    [
        1,2, 1, 
        0, 0, 0, 
        -1, -2, -1
    ]

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSobel.fragmentShader, "Sobel Shader");
    }

    private setUniforms  ()  {
        if (!this.program) throw new Error("Sobel Program is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number = 0;

        const U_IMAGE : string = "u_image";
        const U_KERNEL_X : string = "u_kernel_x";
        const U_KERNEL_Y : string = "u_kernel_y";

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
        const kernelXLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_KERNEL_X);
        const kernelYLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program,  U_KERNEL_Y);
        
        if (! imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (! kernelXLocation) throw new Error(setUniformLocationError(U_KERNEL_X));
        if (! kernelYLocation) throw new Error(setUniformLocationError(U_KERNEL_Y));

        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1fv(kernelXLocation, this.sobelX);
        gl.uniform1fv(kernelYLocation, this.sobelY);
    };

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (!this.program) throw new Error("Sobel Program is not compiled");

        const gl: WebGL2RenderingContext = this.wgl.gl;

        fboPair.write().bind();

        this.wgl.clearCanvas(); // Clear the framebuffer

        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);

        for (let i = 0; i < inputTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, inputTextures[i]);
        }
        
        this.postProcessing.setGlobalUniforms(gl, this.program,fboPair.write().width, fboPair.write().height);
        this.setUniforms();

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.useProgram(null);
        fboPair.write().unbind();
        fboPair.swap()
        return fboPair.read().getTexture();
    }

    private static readonly fragmentShader = 
        `#version 300 es
        precision mediump float;
        
        uniform sampler2D u_image;
        uniform float u_kernel_x[9];
        uniform float u_kernel_y[9];

        in vec2 v_texCoord;

        out vec4 outColor;

        void main () {
            vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));

            vec4 colorSumX = 
            
            texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel_x[0] + 
            texture(u_image, v_texCoord + onePixel * vec2(0, -1)) * u_kernel_x[1] + 
            texture(u_image, v_texCoord + onePixel * vec2(1, -1)) * u_kernel_x[2] +
            texture(u_image, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel_x[3] +
            texture(u_image, v_texCoord + onePixel * vec2(0, 0)) * u_kernel_x[4] +
            texture(u_image, v_texCoord + onePixel * vec2(1, 0)) * u_kernel_x[5] +
            texture(u_image, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel_x[6] +
            texture(u_image, v_texCoord + onePixel * vec2(0, 1)) * u_kernel_x[7] +
            texture(u_image, v_texCoord + onePixel * vec2(1, 1)) * u_kernel_x[8];

            vec4 colorSumY = 
            
            texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel_y[0] + 
            texture(u_image, v_texCoord + onePixel * vec2(0, -1)) * u_kernel_y[1] + 
            texture(u_image, v_texCoord + onePixel * vec2(1, -1)) * u_kernel_y[2] +
            texture(u_image, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel_y[3] +
            texture(u_image, v_texCoord + onePixel * vec2(0, 0)) * u_kernel_y[4] +
            texture(u_image, v_texCoord + onePixel * vec2(1, 0)) * u_kernel_y[5] +
            texture(u_image, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel_y[6] +
            texture(u_image, v_texCoord + onePixel * vec2(0, 1)) * u_kernel_y[7] +
            texture(u_image, v_texCoord + onePixel * vec2(1, 1)) * u_kernel_y[8];

            vec3 magnitude = sqrt((colorSumX.rgb * colorSumX.rgb) + 
                                    (colorSumY.rgb * colorSumY.rgb));

            vec3 normalized = magnitude / sqrt(2.0); // Max gradient magnitude is sqrt(2.0) for normalized kernels

            outColor = vec4(normalized, 1.0);
        }`
}

export default WebGLSobel;