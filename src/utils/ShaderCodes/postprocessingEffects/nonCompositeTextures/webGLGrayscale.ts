import WebGLCore from '../../../webGLCore';
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';

import { RenderFilter } from '../webGLRenderFilter';
import { setUniformLocationError } from '../webGLGetUniformErrorText';
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import Framebuffer from '../../../framebuffer_textures/framebuffer';
import WebGLShaderPass from '../webGLShaderPass';

class WebGLGrayScale implements RenderFilter{
    private readonly framebufferPool: FramebufferPool;
    private readonly wgl : WebGLCore;
    private program : WebGLProgram | null = null;
    private postProcessing : PostProcessingVertexShader;
    constructor (
        wgl: WebGLCore, 
        framebufferPool: FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLGrayScale.fragmentShader, "Grayscale Shader");
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram)  {
        const TEX_NUM : number = 0; 
        const U_IMAGE = 'u_image';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        
        if (imageLocation === null) throw new Error(setUniformLocationError(U_IMAGE));
        
        gl.uniform1i(imageLocation, TEX_NUM);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Grayscale program is not compiled");
        
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
