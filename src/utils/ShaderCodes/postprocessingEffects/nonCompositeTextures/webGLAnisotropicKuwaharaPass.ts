import { RangeSlidersProps } from "../../../../types/slider";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import { RenderFilter } from "../webGLRenderFilter";
import WebGLShaderPass from "../webGLShaderPass";

class WebGLAnisotropicKuwaharaPass implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly framebufferPool: FramebufferPool;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    private kernelSize : number = 5;
    private hardness : number = 50;
    private q : number = 18;
    private zeta : number = 2;
    private zeroCrossing : number = 240;
    private alpha : number = 1;
    public config : RangeSlidersProps[];

    constructor (
        wgl: WebGLCore, 
        framebufferPool: FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
        this.config = [
            {max : 20, min : 4, label : "Radius", value : this.kernelSize, step : 2},
            {max : 100, min : 1, label : "Hardness", value : this.hardness, step : 1},
            {max : 21, min : 1, label : "Sharpness", value : this.q, step : 1},
            {max : 3, min : 1, label : "Zeta", value : this.zeta, step : 0.1},
            {max : 2, min : 0.01, label : "Angle", value : this.zeroCrossing, step : 0.01},
            {max : 2, min : 0.01, label : "Alpha", value : this.alpha, step : 1},
        ]
    }

    public init () {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLAnisotropicKuwaharaPass.fragmentShader, "Anisotropic Kuwahara pass shader")
    }

    public setAttributes (
        kernelSize : number,
        hardness : number,
        q : number,
        zeta : number,
        zeroCrossing : number,
        alpha : number,
    ) {
        this.kernelSize = kernelSize;
        this.hardness = hardness;
        this.q  = q;
        this.zeta = zeta;
        this.zeroCrossing = zeroCrossing ;
        this.alpha = alpha;
    }


    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        /**
         * Accepts 2 textures
         * @param inputTextures[0] : Original Image Texture
         * @param inputTextures[1] : Edge Tangent Flow (From structured Tensor) of the image
        */

        if (!this.program) throw new Error("Anisotropic Kuwahara pass program is not compiled");
        
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
            const U_ETF = 'u_etf';
            const U_KERNEL_SIZE = 'u_kernel_size';
            const U_ZETA : string = 'u_zeta';
            const U_ZERO_CROSSING : string = 'u_zero_crossing';
            const U_HARDNESS : string = 'u_hardness';
            const U_Q : string = 'u_q';
    
            const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
            const etfLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_ETF);
            const kernelSizeLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL_SIZE);
            const zetaLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_ZETA);
            const zeroCrossingLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_ZERO_CROSSING);
            const hardnessLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_HARDNESS);
            const qLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_Q);
            
            if (imageLocation === null) throw new Error(setUniformLocationError(U_IMAGE));
            if (etfLocation === null) throw new Error(setUniformLocationError(U_ETF));
            if (kernelSizeLocation === null) throw new Error(setUniformLocationError(U_KERNEL_SIZE));
            if (zetaLocation === null) throw new Error(setUniformLocationError(U_ZETA));
            if (zeroCrossingLocation === null) throw new Error(setUniformLocationError(U_ZERO_CROSSING));
            if (hardnessLocation === null) throw new Error(setUniformLocationError(U_HARDNESS));
            if (qLocation === null) throw new Error(setUniformLocationError(U_Q));
            
            this.zeroCrossing = (this.zeroCrossing * Math.PI / 180) / 8.0;
            gl.uniform1i(imageLocation, TEX_NUM);
            gl.uniform1i(etfLocation, TEX_NUM + 1);
            gl.uniform1i(kernelSizeLocation, this.kernelSize);
            gl.uniform1f(zetaLocation, this.zeta / (this.kernelSize / 2));
            gl.uniform1f(zeroCrossingLocation,  this.zeroCrossing);
            gl.uniform1f(hardnessLocation, this.hardness);
            gl.uniform1f(qLocation, this.q);
        }
    

    private static readonly fragmentShader =
    `#version 300 es
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform sampler2D u_etf;

    uniform int u_kernel_size;
    uniform float u_zeta;
    uniform float u_zero_crossing;
    uniform float u_hardness;
    uniform float u_q;
    uniform float u_alpha;

    in vec2 v_texCoord;
    out vec4 outColor;

    const float sqrt2_2 = sqrt(2.0) / 2.0;
    void main() {
        vec2 texelSize = 1.0 / vec2(textureSize(u_image, 0));
        int kernelRadius = u_kernel_size / 2;
        float r = float(kernelRadius);

        int k;
        vec4 m[8];
        vec3 s[8];
        
        // Build mean sum and standard deviation sum matrices for each sector
        for (int i = 0; i < 8; ++i) {
            m[i] = vec4(0.0);
            s[i] = vec3(0.0);
        }
            
        // Get eigenvector of least change and anisotropy from the ETF
        vec4 etfInfo = texture(u_etf, v_texCoord);
        vec2 gradient = etfInfo.xy;
        float phi = -atan(gradient.y, gradient.x);
        float Anisotropy = etfInfo.z;

        // kernel axes with clamping calculation
        float a = float(kernelRadius) * (u_alpha / (u_alpha + Anisotropy));
        float b = float(kernelRadius) * ((u_alpha + Anisotropy) / u_alpha);
        a = clamp(a, r, 2.0*r);
        b = clamp(b, 0.5 * r, r);

        // Build Transformation Matrices : Transforms the circle to an ellipse
        float cos_phi = cos(phi);
        float sin_phi = sin(phi);
        mat2 S = mat2(
        1.0/a, 0, 
        0, 1.0/b
        );
        mat2 R_phi = mat2(
        cos_phi, -sin_phi, 
        sin_phi, cos_phi
        );
        mat2 SR = S * R_phi;

        // Axis-Aligned Bounding Box (AABB) of a Rotated Ellipse
        // Calculates the smallest rectangle aligned to the x/y axes that fully contains a rotated ellipse
        int max_x = int(sqrt(a * a * cos_phi * cos_phi + b * b * sin_phi * sin_phi));
        int max_y = int(sqrt(a * a * sin_phi * sin_phi + b * b * cos_phi * cos_phi));

        // Precompute filter parameters
        float sinZeroCrossing = sin(u_zero_crossing);
        float eta = (u_zeta + cos(u_zero_crossing)) / (sinZeroCrossing * sinZeroCrossing);
        float hardnessScale = u_hardness * 1000.0;


        for (int y = -max_y; y <= max_y; y++) {
            for (int x = -max_x; x <= max_x; x++) {
                vec2 v = SR * vec2(float(x), float(y));
                if(dot(v, v) > 0.25) continue;
                vec3 c = texture(u_image, v_texCoord + (vec2(x, y) * texelSize)).rgb;
                c = clamp(c, 0.0, 1.0);
                float sum = 1e-4;
                float w[8];
                float z, vxx, vyy;

                vxx =  u_zeta - eta * v.x * v.x;
                vyy =  u_zeta - eta * v.y * v.y;

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

                v = sqrt2_2  * vec2(v.x - v.y, v.x + v.y); // Rotate 45 degrees;

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
            float w = 1.0 / (1.0 + pow(hardnessScale * sigma2, 0.5 * u_q));
            finalColor += vec4(m[k].rgb * w, w);
        }

        outColor = clamp((finalColor / finalColor.a), 0.0, 1.0);
    }
    `
}


export default WebGLAnisotropicKuwaharaPass;