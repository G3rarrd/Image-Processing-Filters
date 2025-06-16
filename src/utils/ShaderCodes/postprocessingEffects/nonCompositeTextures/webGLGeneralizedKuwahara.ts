import { RangeSlidersProps } from "../../../../types/slider";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";

class WebGLGeneralizedKuwahara {
    private readonly wgl : WebGLCore;
    private readonly framebufferPool: FramebufferPool;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    private kernelSize : number = 5;
    private hardness : number = 50;
    private q : number = 15;
    private u_zeta : number = 2;
    private zeroCrossing : number = 240;
    public config : RangeSlidersProps[];
    
    constructor (
        wgl: WebGLCore, 
        framebufferPool: FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
        this.config = [
            {max : 30, min : 4, label : "Radius", value : this.kernelSize, step : 2},
            {max : 100, min : 1, label : "Hardness", value : this.hardness, step : 1},
            {max : 18, min : 1, label : "Sharpness", value : this.q, step : 1},
            {max : 3, min : 1, label : "Zeta", value : this.u_zeta, step : 0.1},
            {max : 360, min :180, label : "Angle", value : this.zeroCrossing, step : 0.1},
        ]
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLGeneralizedKuwahara.fragmentShader, "Generalized Kuwahara shader")
    }

    public setAttributes (
        kernelSize : number,
        hardness : number,
        q : number,
        u_zeta : number,
        zeroCrossing : number
    ) {
        this.kernelSize = kernelSize;
        this.hardness = hardness;
        this.q  = q;
        this.u_zeta = u_zeta;
        this.zeroCrossing = zeroCrossing * (Math.PI / 8.0);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Generalized Kuwahara program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms(gl: WebGL2RenderingContext, program: WebGLProgram)  {
        const TEX_NUM : number = 0; 
        const U_IMAGE = 'u_image';
        const U_KERNEL_SIZE = 'u_kernel_size';
        const U_u_zeta : string = 'u_zeta';
        const U_ZERO_CROSSING : string = 'u_zero_crossing';
        const U_HARDNESS : string = 'u_hardness';
        const U_Q : string = 'u_q';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        const kernelSizeLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL_SIZE);
        const u_zetaLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_u_zeta);
        const zeroCrossingLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_ZERO_CROSSING);
        const hardnessLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_HARDNESS);
        const qLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_Q);
        
        if (imageLocation === null) throw new Error(setUniformLocationError(U_IMAGE));
        if (kernelSizeLocation === null) throw new Error(setUniformLocationError(U_KERNEL_SIZE ));
        if (u_zetaLocation === null) throw new Error(setUniformLocationError(U_u_zeta));
        if (zeroCrossingLocation === null) throw new Error(setUniformLocationError(U_ZERO_CROSSING));
        if (hardnessLocation === null) throw new Error(setUniformLocationError(U_HARDNESS));
        if (qLocation === null) throw new Error(setUniformLocationError(U_Q));
        
        this.zeroCrossing = (this.zeroCrossing * (Math.PI / 180)) / 8;
        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1i(kernelSizeLocation, this.kernelSize);
        gl.uniform1f(u_zetaLocation, this.u_zeta / (this.kernelSize / 2));
        gl.uniform1f(zeroCrossingLocation, this.zeroCrossing);
        gl.uniform1f(hardnessLocation, this.hardness);
        gl.uniform1f(qLocation, this.q);
    }

    private static readonly fragmentShader =
    `#version 300 es
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform int u_kernel_size;
    uniform float u_zeta;
    uniform float u_zero_crossing;
    uniform float u_hardness;
    uniform float u_q;


    in vec2 v_texCoord;
    out vec4 outColor;

    const float sqrt2_2 = sqrt(2.0) / 2.0;
    void main() {
        vec2 texelSize = 1.0 / vec2(textureSize(u_image, 0));
        
        int k;
        vec4 m[8];
        vec3 s[8];

        for (int i = 0; i < 8; ++i) {
            m[i] = vec4(0.0);
            s[i] = vec3(0.0);
        }

        int kernelRadius = u_kernel_size / 2;
        float sinZeroCrossing = sin(u_zero_crossing);
        float eta = (u_zeta + cos(u_zero_crossing)) / (sinZeroCrossing * sinZeroCrossing);

        for (int y = -kernelRadius; y <= kernelRadius; y++) {
            for (int x = -kernelRadius; x <= kernelRadius;x++) {
                vec2 v = vec2(x, y) / float(kernelRadius);
                vec3 c = texture(u_image, v_texCoord + (vec2(x, y)  * texelSize)).rgb;
                c = clamp(c, 0.0, 1.0);
                float sum = 1e-12;
                float w[8];
                float z, vxx, vyy;

                // Polynomial weights calculation
                vxx = u_zeta - eta * v.x * v.x;
                vyy = u_zeta - eta * v.y * v.y;

                z = max(0.0, v.y + vxx);
                w[0] = z*z;
                sum += w[0];

                z = max(0.0, -v.x + vyy);
                w[2] = z*z;
                sum += w[2];

                z = max(0.0, -v.y + vxx);
                w[4] = z*z;
                sum += w[4];

                z = max(0.0, v.x + vyy);
                w[6] = z*z;
                sum += w[6];

                v = sqrt2_2 * vec2(v.x - v.y, v.x + v.y); // Rotate 45 degrees;

                vxx = u_zeta - eta * v.x * v.x;
                vyy = u_zeta - eta * v.y * v.y;

                z = max(0.0, v.y + vxx);
                w[1] = z*z;
                sum += w[1];

                z = max(0.0, -v.x + vyy);
                w[3] = z*z;
                sum += w[3];

                z = max(0.0, -v.y + vxx);
                w[5] = z*z;
                sum += w[5];

                z = max(0.0, v.x + vyy);
                w[7] = z*z;
                sum += w[7];

                float g = exp(-3.125 * dot(v, v)) / sum;

                for (int k = 0; k < 8; k++) {
                    float wk = w[k] * g;
                    m[k] += vec4(c * wk, wk);
                    s[k] += c * c * wk;
                }
            }
        }
            
        vec4 finalColor = vec4(0.0);
        for (k = 0; k < 8; k++) {
            m[k].rgb /= m[k].a;
            s[k] = abs(s[k] / m[k].a - m[k].rgb * m[k].rgb);

            float sigma2 = s[k].r + s[k].g + s[k].b;
            float w = 1.0 / (1.0 + pow(u_hardness * 1000.0 * sigma2, 0.5 * u_q));
            finalColor += vec4(m[k].rgb * w, w);
        }

        outColor = clamp((finalColor / finalColor.a), 0.0, 1.0);
    }
    `
}


export default WebGLGeneralizedKuwahara;