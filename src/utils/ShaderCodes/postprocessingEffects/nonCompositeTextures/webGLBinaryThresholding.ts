import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import WebGLShaderPass from "../webGLShaderPass";
import { RenderFilter } from "../webGLRenderFilter";

class WebGLBinaryThreshold implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    private program : WebGLProgram | null = null;
    private threshold : number =0.01;
    constructor(
        wgl : WebGLCore,
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLBinaryThreshold.fragmentShader, "Binary Threshold Shader");
    }

    public setAttributes(threshold : number) : void {
        this.threshold = threshold;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Binary Threshold program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) : void {
        const TEX_NUM : number = 0;
        const U_IMAGE : string =  "u_image";
        const U_THRESHOLD : string = "threshold";
        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program,U_IMAGE);
        const thresholdLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_THRESHOLD);

        if (! imageLocation) throw new Error("Image cannot be found");
        if (! thresholdLocation) throw new Error("Threshold not found");

        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1f(thresholdLocation, this.threshold);
    } 

    private static readonly fragmentShader = 
    `#version 300 es
    
    precision mediump float;

    uniform sampler2D u_image;
    
    uniform float threshold;
    
    in vec2 v_texCoord;
    
    out vec4 outColor;
    
    void main () {
        vec4 color = texture(u_image, v_texCoord);
        float average = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float mask = step(threshold, average); // Same as if else but more gpu friendly
        outColor = vec4(vec3(mask), 1.0);
    }`
}

export default WebGLBinaryThreshold;