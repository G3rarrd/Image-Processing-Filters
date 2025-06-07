import FramebufferPair from '../../../framebuffer_textures/framebufferPair';
import WebGLCore from '../../../webGLCore';
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';

import { RenderFilter } from '../webGLRenderFilter';
import { setUniformLocationError } from '../webGLGetUniformErrorText';

class WebGLGrayScale implements RenderFilter{
    public program : WebGLProgram | null = null;
    private wgl : WebGLCore;
    private postProcessing : PostProcessingVertexShader;
    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLGrayScale.fragmentShader, "Grayscale Shader");
    }

    private setUniforms()  {
        if (!this.program) throw new Error("Grayscale program is not compiled");
        
        const gl : WebGL2RenderingContext= this.wgl.gl;
        const TEX_NUM : number = 0; 
        const U_IMAGE = 'u_image';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
        
        if (imageLocation === null) throw new Error(setUniformLocationError(U_IMAGE));
        
        gl.uniform1i(imageLocation, TEX_NUM);
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (!this.program) throw new Error("Grayscale program is not compiled");
        
        console.log(inputTextures[0] == fboPair.write().getTexture());
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
    
    in vec2 v_texCoord;

    out vec4 outColor;

    void main() {
        vec4 color = texture(u_image, v_texCoord);
        
        vec3 weights = vec3(0.21, 0.72, 0.07);

        float luminance = dot(color.rgb, weights);
        outColor = vec4(vec3(luminance), 1.0);
    }`
}
export default WebGLGrayScale;
