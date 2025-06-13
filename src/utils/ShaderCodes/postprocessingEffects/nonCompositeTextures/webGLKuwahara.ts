import { RenderFilter } from "../webGLRenderFilter";
import WebGLCore from '../../../webGLCore';
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import WebGLShaderPass from "../webGLShaderPass";
import { RangeSlidersProps } from "../../../../types/slider";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import { setUniformLocationError } from "../webGLGetUniformErrorText";

class WebGLKuwahara implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program : WebGLProgram | null = null;
    private framebufferPool : FramebufferPool;
    private kernelSize : number = 3;
    public config : RangeSlidersProps[];


    constructor (
        wgl: WebGLCore, 
        framebufferPool: FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
        this.config = [{max : 21, min : 3, label : "Radius", value : 3, step : 2}]
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLKuwahara.fragmentShader, "Kuwahara shader")
    }

    public setAttributes (kernelSize : number) {
        this.kernelSize = kernelSize;
    }


    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Kuwahara program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms(gl : WebGLRenderingContext, program : WebGLProgram) {
        const U_KERNEL_SIZE : string = 'u_kernel_size';
        const U_IMAGE : string = 'u_image';
        const TEX_NUM : number = 0;

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        const kernelSizeLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL_SIZE);
        if (imageLocation === null) throw new Error(setUniformLocationError(U_IMAGE));
        if (kernelSizeLocation  === null) throw new Error(setUniformLocationError(U_KERNEL_SIZE));
        gl.uniform1i(kernelSizeLocation, this.kernelSize);
        gl.uniform1i(imageLocation, TEX_NUM);
    }

    private static readonly fragmentShader = 
    `#version 300 es
    precision mediump float;
    uniform sampler2D u_image;
    uniform int u_kernel_size;

    in vec2 v_texCoord;
    out vec4 outColor;

    vec4 quadStdCalc(int startX, int startY, int endX, int endY, vec2 texelSize) {
        vec3 quadSum = vec3(0.0);
        int count = 0;

        for (int x = startX; x <= endX; x++) {
            for (int y = startY; y <= endY; y++) {
                vec2 offset = vec2(float(x), float(y)) * texelSize;
                quadSum += texture(u_image, v_texCoord + offset).rgb;
                count++;
            }
        }

        vec3 quadMean =  quadSum / float(count);

        vec3 quadStd = vec3(0.0);
        for (int x = startX; x <= endX; x++) {
            for (int y = startY; y <= endY; y++) {
                vec2 offset = vec2(float(x), float(y)) * texelSize;
                vec3 diff  = (texture(u_image, v_texCoord + offset).rgb - quadMean);
                quadStd += diff *diff;
            }
        }

        quadStd /= float(count);
        float intensity = dot(sqrt(quadStd), vec3(1.0)) / 3.0;
        return vec4(quadMean, intensity);
    }

    void main() {
        vec4 pixelColor = texture(u_image, v_texCoord);
        vec2 textureResolution = vec2(textureSize(u_image, 0));
        vec2 texelSize = 1.0 / textureResolution;

        int halfSize = u_kernel_size / 2;
        
        // 
        vec4 topLeftColor = quadStdCalc(-halfSize, -halfSize, 0, 0, texelSize);
        vec4 topRightColor = quadStdCalc(0, -halfSize, halfSize, 0, texelSize);
        vec4 bottomLeftColor = quadStdCalc(-halfSize, 0, 0, halfSize, texelSize);
        vec4 bottomRightColor = quadStdCalc(0, 0, halfSize, halfSize, texelSize);

        // Track min intensity and color
        float minIntensity = topLeftColor.a;
        vec3 minColor = topLeftColor.rgb;

        if (topRightColor.a < minIntensity) {
            minIntensity = topRightColor.a;
            minColor = topRightColor.rgb;
        }
        if (bottomLeftColor.a < minIntensity) {
            minIntensity = bottomLeftColor.a;
            minColor = bottomLeftColor.rgb;
        }
        if (bottomRightColor.a < minIntensity) {
            minIntensity = bottomRightColor.a;
            minColor = bottomRightColor.rgb;
        }

        outColor = vec4(minColor, 1.0);
    }
    `




}

export default WebGLKuwahara;