import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import { RenderFilter } from "../webGLRenderFilter";

class WebGLInvert implements RenderFilter {
    private wgl : WebGLCore;
    private postProcessing : PostProcessingVertexShader;
    private program : WebGLProgram | null = null;
    constructor (wgl : WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLInvert.fragmentShader, "Invert Shader");
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Invert Program is not compiled");
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
    
    private setUniforms() : void {
        if (! this.program) throw new Error("Invert Program is not compiled");
        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number = 0;
        const U_IMAGE : string = 'u_image';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
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