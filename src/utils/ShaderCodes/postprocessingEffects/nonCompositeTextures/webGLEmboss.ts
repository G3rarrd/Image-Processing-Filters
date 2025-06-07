import { RenderFilter } from "../webGLRenderFilter";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
class WebGLEmboss implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly  postProcessing : PostProcessingVertexShader;
    public program : WebGLProgram | null = null;
    
    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, this.embossFragmentShaderSrc, "Emboss Fragment Shader");
    }

    private emboss : number[] = 
    [
        -2, -1,  0,
        -1,  1,  1,
        0,  1,  2,
    ]

    private embossFragmentShaderSrc = 
    `#version 300 es
    
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

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
        if (u_kernelWeight != 0.0) {
            color /= u_kernelWeight;
        }

        outColor = vec4(color, 1.0);
    }
    `

    private setUniforms  ()  {
        if (! this.program) throw new Error("Emboss Program failed to load");
        const gl = this.wgl.gl;
        const TEX_NUM = 0;

        const imageLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "u_image");
        
        
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "u_kernel");
        const kernelWeightLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, "u_kernelWeight");
        const kernelWeight = this.emboss.reduce((acc, val) => acc + val, 0);
        
        gl.uniform1f(kernelWeightLocation, kernelWeight)
        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1fv(kernelLocation, this.emboss);
    };

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Emboss Program failed to load");

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
}

export default WebGLEmboss;