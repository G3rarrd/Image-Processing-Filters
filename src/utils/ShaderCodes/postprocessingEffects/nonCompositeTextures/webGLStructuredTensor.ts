import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import { setUniformLocationError } from "../webGLGetUniformErrorText";

class WebGLStructuredTensor implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    
    constructor (
        wgl:WebGLCore, 
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();   
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLStructuredTensor.fragmentShader, "Structured Tensor Shader");
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error ("Structured Tensor Program is not compiled");

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

    private setUniforms = () => {
        if (! this.program) throw new Error ("Structured Tensor Program is not compiled");
        
        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number = 0;
        const U_IMAGE : string = "u_image";

        const imageLocation = gl.getUniformLocation(this.program, U_IMAGE);
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));

        gl.uniform1i(imageLocation, TEX_NUM);
    };


    private static readonly fragmentShader = 
    `#version 300 es
    precision highp float;
    
    uniform sampler2D u_image;
    
    in vec2 v_texCoord;
    
    out vec4 outColor;

    void main () {
        vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

        vec4 colorSumX =     
        texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) *  1.0+ 
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

        // Gradients
        float gradX = colorSumX.r;
        float gradY = colorSumY.r;

        // Structured Tensor;
        float xx = gradX * gradX;
        float xy = gradX * gradY;
        float yy = gradY * gradY;

        // Output structured Tensor
        outColor = vec4(xx, yy, xy, 1.0);
    }`;
}

export default WebGLStructuredTensor;
