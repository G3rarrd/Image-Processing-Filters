import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import WebGLShaderPass from "../webGLShaderPass";
import Framebuffer from '../../../framebuffer_textures/framebuffer';
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';

class WebGLFlowField implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    private program: WebGLProgram | null = null; 

    /**
    */
    
    constructor (
        wgl:WebGLCore, 
        framebufferPool : FramebufferPool
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLFlowField.fragmentShader, "Flow Field Shader");
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (! this.program) throw new Error("Flow Field Shader is not compiled");

        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }


    // private setMaxAndMinMagnitude(width : number, height : number) {
    //     const gl = this.wgl.gl;
    //     const pixelData = new Float32Array(width * height * 4);
    //     // gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixelData);
    //     // this.updateMinMaxFromPixels(pixelData);
    // }

    // private updateMinMaxFromPixels(pixelData: Float32Array) {
    //     /* Resets the min and max magnitude for each call */ 
    //     this.minMagnitude = Infinity; 
    //     this.maxMagnitude = -Infinity;
    //     for (let i = 0; i < pixelData.length; i += 4) {
    //         const magnitude = pixelData[i + 2];
    //         if (!isFinite(magnitude)) continue; // Skip Nans/infs
    //         this.minMagnitude = Math.min(this.minMagnitude, magnitude)
    //         this.maxMagnitude = Math.max(this.maxMagnitude, magnitude)
    //     }
    // }


    

    private setUniforms (gl: WebGL2RenderingContext, program: WebGLProgram) {
        const TEX_NUM : number = 0;
        const U_IMAGE : string = 'u_image';
        const imageLocation = gl.getUniformLocation(program, U_IMAGE );

        if (!imageLocation) throw new Error("Image cannot be found");
        gl.uniform1i(imageLocation, TEX_NUM);
    };

    private static readonly fragmentShader = 
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_image;

    in vec2 v_texCoord;

    out vec4 outColor;

    float calcGrayScale(in vec4 col) {
        const vec3 kernel = vec3(0.2126, 0.7152, 0.0722); // Luminance
        return dot(kernel, col.rgb);
    }

    vec2 getPerpendicularVec(in vec2 v) {
        return vec2(v.y, -v.x);
    }

    vec2 sobelFilter() {
        vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));
        vec2 uv = v_texCoord;

        const vec3 kernel0 = vec3(-1.0, -2.0, -1.0);
        const vec3 kernel1 = vec3( 1.0,  2.0,  1.0);

        vec4 c00 = texture(u_image, uv + vec2(-1.0, -1.0) * onePixel);
        vec4 c01 = texture(u_image, uv + vec2( 0.0, -1.0) * onePixel);
        vec4 c02 = texture(u_image, uv + vec2( 1.0, -1.0) * onePixel);

        vec4 c10 = texture(u_image, uv + vec2(-1.0,  0.0) * onePixel);
        vec4 c12 = texture(u_image, uv + vec2( 1.0,  0.0) * onePixel);

        vec4 c20 = texture(u_image, uv + vec2(-1.0,  1.0) * onePixel);
        vec4 c21 = texture(u_image, uv + vec2( 0.0,  1.0) * onePixel);
        vec4 c22 = texture(u_image, uv + vec2( 1.0,  1.0) * onePixel);

        float y00 = calcGrayScale(c00);
        float y01 = calcGrayScale(c01);
        float y02 = calcGrayScale(c02);
        float y10 = calcGrayScale(c10);
        float y12 = calcGrayScale(c12);
        float y20 = calcGrayScale(c20);
        float y21 = calcGrayScale(c21);
        float y22 = calcGrayScale(c22);

        float u = 0.0;
        u += dot(kernel0, vec3(y00, y10, y20));
        u += dot(kernel1, vec3(y02, y12, y22));

        float v = 0.0;
        v += dot(kernel0, vec3(y00, y01, y02));
        v += dot(kernel1, vec3(y20, y21, y22));

        return vec2(u, v); 
    }

    void main() {
        vec2 grad = sobelFilter();
        float mag = length(grad);
        grad = getPerpendicularVec(grad);
        outColor = vec4(grad, mag, 1.0);
    }`;
}

export default WebGLFlowField;
