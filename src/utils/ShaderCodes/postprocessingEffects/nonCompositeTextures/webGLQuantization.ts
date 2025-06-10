import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import type { RangeSlidersProps } from "../../../../types/slider";

class WebGLQuantization implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly framebufferPool: FramebufferPool;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    private colorCount : number = 2;
    public config : RangeSlidersProps[];
    /** 
    */
    constructor (wgl : WebGLCore, framebufferPool: FramebufferPool) 
    {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
        this.config = [{
            min: 2,
            max: 255,
            step : 1,
            value: this.colorCount,
            label: "Color Count"
        }];
    }

    public init(){
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLQuantization.fragmentShader, "Quantization Shader");
    }

    public setAttributes(colorCount : number) : void {
        this.colorCount = colorCount;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Quantization program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms (gl: WebGL2RenderingContext, program: WebGLProgram) : void {

        const U_IMAGE : string = 'u_image';
        const U_COLOR_COUNT : string = 'u_color_count'

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        const colorCountLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_COLOR_COUNT);

        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (!colorCountLocation) throw new Error(setUniformLocationError(U_COLOR_COUNT));

        /* Set the Uniforms */ 
        gl.uniform1i(imageLocation, 0);
        gl.uniform1f(colorCountLocation,this.colorCount);
    };

    private static readonly fragmentShader: string = 
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_image;
    uniform float u_color_count;

    in vec2 v_texCoord;

    out vec4 outColor;

    vec3 quantization(vec3 color) {
        float n = u_color_count - 1.0;
        vec3 newColor = floor((color*n) + vec3(0.5)) / n;
        return newColor;
    }

    void main() {
        vec3 color = texture(u_image, v_texCoord).rgb;
        vec3 newColor = quantization(color);
        outColor = vec4(newColor, 1.0);
    }
    `;
}

export default WebGLQuantization;
