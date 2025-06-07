import { RenderFilter } from "../webGLRenderFilter";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
class WebGLSharpen implements RenderFilter{
    public program : WebGLProgram | null = null;
    private wgl : WebGLCore;
    private postProcessing : PostProcessingVertexShader;
    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
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

    private setUniforms  ()  {
        if (!this.program) throw new Error("Sharpen program is not compiled");
        const gl = this.wgl.gl;
        const TEX_NUM : number = 0;

        const U_IMAGE : string = "u_image";
        const U_KERNEL : string = "u_kernel";
        const U_KERNEL_WEIGHT : string = "u_kernel_weight";

        const imageLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program,U_IMAGE);
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program,U_KERNEL);
        const kernelWeightLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program,  U_KERNEL_WEIGHT);
        
        if (! imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (! kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (! kernelWeightLocation) throw new Error(setUniformLocationError(U_KERNEL_WEIGHT));
        
        const kernelWeight = this.sharpen.reduce((acc, val) => acc + val, 0);
        
        gl.uniform1f(kernelWeightLocation, kernelWeight)
        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1fv(kernelLocation, this.sharpen);
    };

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (!this.program) throw new Error("Sharpen program is not compiled");

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