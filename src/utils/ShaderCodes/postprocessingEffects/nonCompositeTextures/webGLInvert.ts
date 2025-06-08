import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import WebGLShaderPass from "../webGLShaderPass";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import { RenderFilter } from "../webGLRenderFilter";

class WebGLInvert implements RenderFilter {
    private readonly framebufferPool: FramebufferPool;
    private readonly wgl : WebGLCore;
    public program : WebGLProgram | null = null;
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
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLInvert.fragmentShader, "Invert Shader");
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Invert program is not compiled");
        
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
        const U_IMAGE : string = 'u_image';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        if (! imageLocation) throw new Error(setUniformLocationError(U_IMAGE));

        gl.uniform1i(imageLocation, TEX_NUM);
    }

    private static readonly fragmentShader : string =
        `#version 300 es
        precision mediump float;

        uniform sampler2D u_image;

        in vec2 v_texCoord;

        out vec4 outColor;

        void main() {
            vec4 color = texture(u_image, v_texCoord);
            vec3 invert = vec3(1.0) - color.rgb;
            outColor = vec4(invert, 1.0);
        }`

}

export default WebGLInvert;