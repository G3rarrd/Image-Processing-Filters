import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";

class WebGLXDoGThreshold implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool : FramebufferPool;
    private program : WebGLProgram | null = null;
    private tau: number = 1.0;
    private epsilon: number = 0.9;
    private phi: number = 1.0;

    constructor(
        wgl : WebGLCore, 
        framebufferPool : FramebufferPool
    ) {
        this.postProcessing = new PostProcessingVertexShader();
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
    }

    public init () : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader,this.fragmentShader, "XDoG Threshold Shader");
    }

    public setAttributes(tau : number, epsilon : number, phi : number) {
        this.tau = tau;
        this.epsilon = epsilon;
        this.phi = phi;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer {
        /* Uses 2 textures */ 
        if (! this.program) throw new Error("XDoG Threshold Program is not compiled");

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
        const TEX_NUM_1 : number = 1;
        
        const U_IMAGE_1 : string = "u_image_1";
        const U_IMAGE_2 : string = 'u_image_2';

        const U_TAU : string = 'u_tau';
        const U_PHI : string = 'u_phi';
        const U_EPSILON : string = 'u_epsilon';

        const image1Location : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE_1);
        const image2Location : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE_2);
        const tauLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_TAU);
        const phiLocation : WebGLUniformLocation | null = gl.getUniformLocation(program,U_PHI);
        const epsilonLocation : WebGLUniformLocation | null = gl.getUniformLocation(program,U_EPSILON);

        if (!image1Location) throw new Error(setUniformLocationError(U_IMAGE_1));
        if (!image2Location) throw new Error(setUniformLocationError(U_IMAGE_2));
        if (!tauLocation) throw new Error(setUniformLocationError(U_TAU));
        if (!phiLocation) throw new Error(setUniformLocationError(U_PHI));
        if (!epsilonLocation) throw new Error(setUniformLocationError(U_EPSILON));

        gl.uniform1i(image1Location, TEX_NUM);
        gl.uniform1i(image2Location, TEX_NUM_1);
        gl.uniform1f(tauLocation, this.tau);
        gl.uniform1f(phiLocation, this.phi);
        gl.uniform1f(epsilonLocation, this.epsilon);
    }

    private fragmentShader = 
    `#version 300 es
    precision mediump float;
    
    uniform sampler2D u_image_1;
    uniform sampler2D u_image_2;
    
    uniform float u_tau;
    uniform float u_epsilon;
    uniform float u_phi; 

    in vec2 v_texCoord;

    out vec4 outColor;

    float computeXDoG (float difference) {
        if (difference >= u_epsilon ) return 1.0;
        return 1.0 + tanh(u_phi * (difference - u_epsilon));
    }

    float luminance(vec3 color) {
        return dot(color, vec3(0.21, 0.72, 0.07));
    }

    void main () {
        vec3 color1 = texture(u_image_1, v_texCoord).rgb;
        vec3 color2 = texture(u_image_2, v_texCoord).rgb;

        float luminance1 = luminance(color1);
        float luminance2 = luminance(color2);

        float difference = ((1.0 + u_tau) * luminance1) - (u_tau * luminance2);

        float result = computeXDoG(difference);

        outColor = vec4(vec3(result), 1.0);
    }`
}

export default WebGLXDoGThreshold;