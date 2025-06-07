import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";

class WebGLTanhThreshold implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program : WebGLProgram | null = null;
    private tau: number = 1.0;

    constructor(wgl : WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();

    }

    public init(): void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader,WebGLTanhThreshold.fragmentShader, "Tanh Threshold Shader" );
    }

    public setAttributes(tau : number) {
        this.tau = tau;
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Tanh Threshold program is not compiled");

        const gl: WebGL2RenderingContext = this.wgl.gl;

        fboPair.write().bind();

        this.wgl.clearCanvas(); // Clear the framebuffer

        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTextures[0]);

        this.postProcessing.setGlobalUniforms(gl, this.program,fboPair.write().width, fboPair.write().height);
        this.setUniforms();

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.useProgram(null);
        fboPair.write().unbind();
        fboPair.swap()
        return fboPair.read().getTexture();
    }

    private setUniforms() {
        if (! this.program) throw new Error("Tanh Threshold program is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number = 0;
        
        const U_DoG : string = 'u_dog';
        const U_TAU : string = 'u_tau';

        const dogLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_DoG);
        const tauLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program,U_TAU);

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