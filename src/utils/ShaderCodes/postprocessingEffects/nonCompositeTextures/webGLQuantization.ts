import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLQuantization implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    private colorCount = 2;
    /** 
    */
    constructor (wgl : WebGLCore) 
    {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init(){
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLQuantization.fragmentShader, "Quantization Shader");
    }

    public setAttributes(colorCount : number) : void {
        this.colorCount = colorCount;
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        /* Uses only one texture */ 

        if (! this.program) throw new Error ("Quantization Program is not compiled");
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

    private setUniforms () : void {
        if (! this.program) throw new Error ("Quantization Program is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;

        const U_IMAGE : string = 'u_image';
        const U_COLOR_COUNT : string = 'u_color_count'

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
        const colorCountLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_COLOR_COUNT);

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
