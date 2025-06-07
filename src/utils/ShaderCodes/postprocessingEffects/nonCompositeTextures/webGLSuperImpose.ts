import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";

class WebGLSuperImpose implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program : WebGLProgram | null = null;
    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init () : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSuperImpose.fragmentShader, "Super Impose Shader");
    }

    private setUniforms()  {
        if (!this.program) throw new Error("Super Impose Program is not compiled");

        const gl  = this.wgl.gl;
        const TEX_NUM : number = 0;
        const TEX_NUM_1 : number = 1;

        const U_IMAGE : string = 'u_image';
        const U_FDoG : string = 'u_fdog';

        const imageLocation1 = gl.getUniformLocation(this.program, U_IMAGE);
        const imageLocation2 = gl.getUniformLocation(this.program, U_FDoG);

        if (!imageLocation1) throw new Error(setUniformLocationError(U_IMAGE))
        if (!imageLocation2) throw new Error(setUniformLocationError(U_FDoG))

        gl.uniform1i(imageLocation1, TEX_NUM);
        gl.uniform1i(imageLocation2, TEX_NUM_1);
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (!this.program) throw new Error("Super Impose Program is not compiled");

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
        uniform sampler2D u_fdog;
        in vec2 v_texCoord;
        out vec4 outColor; 

        void main() {
            vec4 imagePixelColor = texture(u_image, v_texCoord);
            vec4 fdogPixelColor = texture(u_fdog, v_texCoord); // most likely 1.0 or 0.0 rgb values

            vec3 finalColor = imagePixelColor.rgb;
            if (fdogPixelColor.r == 0.0) finalColor = vec3(0.0);

            outColor = vec4(finalColor, 1.0);
        }`
}

export default WebGLSuperImpose;