import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import WebGLShaderPass from "../webGLShaderPass";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import { RangeSlidersProps } from "../../../../types/slider";

class WebGLDithering implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    
    private  program: WebGLProgram | null = null; 
    private spreadValue : number = 0.01;
    private bayerType : number = 4;
    public config : RangeSlidersProps[];
    /** 

    */

    // Bayer2
    private bayers : number[][]= [
    [
        0, 2, 
        3, 1
    ],
    // Bayer4
    [ 
        0, 8, 2, 10, 
        12, 4, 14, 6,
        3, 11, 1, 9,
        15, 7, 13, 5
    ],
    // Bayer8
    [ 
        0, 32,  8, 40,  2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44,  4, 36, 14, 46,  6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43,  1, 33,  9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47,  7, 39, 13, 45,  5, 37,
        63, 31, 55, 23, 61, 29, 53, 21
    ],

    // bayer8Luminance
    [
        16, 11, 10, 16, 24, 40, 51, 61,
        12, 12, 14, 19, 26, 58, 60, 55,
        14, 13, 16, 24, 40, 57, 69, 56,
        14, 17, 22, 29, 51, 87, 80, 62,
        18, 22, 37, 56, 68,109,103, 77,
        24, 35, 55, 64, 81,104,113, 92,
        49, 64, 78, 87,103,121,120,101,
        72, 92, 95, 98,112,100,103, 99
    ]
    ];

    constructor (
        wgl: WebGLCore,
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.postProcessing = new PostProcessingVertexShader();
        this.config = [{
            min: 0.01,
            max: 10,
            step : 0.01,
            value: this.spreadValue,
            label: "Spread Value"
        },
    {
            min: 1,
            max: 4,
            step: 1,
            value: this.bayerType,
            label: "Bayer Type"
        }];
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLDithering.fragmentShader, "Dithering Blur");
    }

    public setAttributes(spreadValue : number, bayerType : number) : void {
        this.spreadValue = spreadValue;
        this.bayerType = bayerType;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        /**
         * Accepts 1 texture
         * @param inputTextures[0] : Original Image or edited Texture
        */
        
        if (! this.program) throw new Error("Edge Blur Pass Shader program is not compiled");
        
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

        const bayer : number[] = this.bayers[this.bayerType - 1];
        const TEX_NUM = 0;

        const U_IMAGE = 'u_image';
        const U_BAYER = 'u_bayer';
        const U_BAYER_SIZE = 'u_bayer_size';
        const U_SPREAD_VALUE = 'u_spread_value'

        const imageLocation = gl.getUniformLocation(program, U_IMAGE);
        const bayerLocation = gl.getUniformLocation(program,  U_BAYER);
        const bayerSizeLocation = gl.getUniformLocation(program,  U_BAYER_SIZE);
        const spreadLocation = gl.getUniformLocation(program, U_SPREAD_VALUE);
        
        if (! bayer) throw new Error("Invalid bayer type");

        if (! imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (! bayerLocation) throw new Error(setUniformLocationError(U_BAYER));
        if (! bayerSizeLocation) throw new Error(setUniformLocationError(U_BAYER_SIZE));
        if (! spreadLocation) throw new Error(setUniformLocationError(U_SPREAD_VALUE));
        
        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1iv(bayerLocation, bayer);
        gl.uniform1i(bayerSizeLocation, Math.sqrt(bayer.length));
        gl.uniform1f(spreadLocation, this.spreadValue);
    };


    private static readonly fragmentShader =
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_image;

    uniform int u_bayer[256];
    uniform int u_bayer_size;

    uniform float u_spread_value;

    in vec2 v_texCoord;

    out vec4 outColor;

    void main() {
        ivec2 texDimensions = textureSize(u_image, 0);
        vec3 color = texture(u_image, v_texCoord).rgb;
        vec3 newColor = vec3(0.0);

        float width = float(texDimensions.x);
        float height = float(texDimensions.y);

        int x = int(v_texCoord.x * width);
        int y = int(v_texCoord.y * height);
        
        x %= u_bayer_size;
        y %= u_bayer_size;

        float M = float(u_bayer[y * u_bayer_size + x]);

        float mSize = float(u_bayer_size*u_bayer_size);
        float noise = ((M * (1.0 / mSize)) - 0.5) * u_spread_value;

        vec3 ditheredColor = color + vec3(noise);

        newColor = color + vec3(noise);

        outColor = vec4(newColor, 1.0);
    }`;
}


export default WebGLDithering;
