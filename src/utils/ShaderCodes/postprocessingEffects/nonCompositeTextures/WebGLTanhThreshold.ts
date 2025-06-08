import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import Framebuffer from "../../../framebuffer_textures/framebuffer";

class WebGLTanhThreshold implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    private program : WebGLProgram | null = null;
    private tau: number = 1.0;

    constructor(
        wgl : WebGLCore,
        framebufferPool : FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    public init(): void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader,WebGLTanhThreshold.fragmentShader, "Tanh Threshold Shader" );
    }

    public setAttributes(tau : number) {
        this.tau = tau;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer {
        /* Uses 1 texture */ 
        if (! this.program) throw new Error("Tanh Threshold program is not compiled");

        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
        const TEX_NUM : number = 0;
        
        const U_DoG : string = 'u_dog';
        const U_TAU : string = 'u_tau';

        const dogLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_DoG);
        const tauLocation : WebGLUniformLocation | null = gl.getUniformLocation(program,U_TAU);

        if (! dogLocation) throw new Error(setUniformLocationError(U_DoG));
        if (! tauLocation) throw new Error(setUniformLocationError(U_TAU));

        gl.uniform1i(dogLocation, TEX_NUM);
        gl.uniform1f(tauLocation, this.tau);
    } 

    private static readonly fragmentShader = 
        `#version 300 es
        
        precision mediump float;

        uniform sampler2D u_dog;
        uniform float u_tau;

        in vec2 v_texCoord;
        
        out vec4 outColor;
        
        void main () {
            vec4 color = texture(u_dog, v_texCoord);

            float H = dot(color.rgb, vec3(0.299, 0.587, 0.114));

            float finalColor = 0.0;
            float smoothedValue = 1.0 + tanh(H);

            if (H < 0.0 && smoothedValue < u_tau) {
                finalColor = 0.0; 
            } else {
                finalColor = 1.0;
            }
            
            outColor = vec4(vec3(finalColor), 1.0);
        }`
}

export default WebGLTanhThreshold;