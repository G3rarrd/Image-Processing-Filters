import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLCompileFilters from "../webGLCompileFilters";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import { RangeSlidersProps } from "../../../../types/slider";
import WebGLETFEigenvector from "./webGLETFEigenvector";
import WebGLGrayScale from "../nonCompositeTextures/webGLGrayscale";
import WebGLAnisotropicKuwaharaPass from "../nonCompositeTextures/webGLAnisotropicKuwaharaPass";

class WebGLAnisotropicKuwahara implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly compiledFilters : WebGLCompileFilters;
    private readonly framebufferPool: FramebufferPool;
    private readonly etfEigenvectorAnisotropicMap : WebGLETFEigenvector;
    private kernelSize : number = 5;
    private hardness : number = 100;
    private sharpness : number = 18;
    private zeta : number = 2;
    private zeroCrossing : number = 240; // degrees
    private alpha : number = 1;
    private sigma : number = 1.6;
    public config : RangeSlidersProps[];

    constructor (
        wgl:WebGLCore,
        compiledFilters : WebGLCompileFilters,
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.compiledFilters = compiledFilters;
        
        this.config = [
            {max : 30, min : 4, label : "Radius", value : this.kernelSize, step : 2},
            {max : 200, min : 1, label : "Hardness", value : this.hardness, step : 1},
            {max : 21, min : 1, label : "Sharpness", value : this.sharpness, step : 1},
            {max : 3, min : 1, label : "Zeta", value : this.zeta, step : 0.1},
            {max : 360, min :180, label : "Angle", value : this.zeroCrossing, step : 0.1},
            {max : 2, min : 0.01, label : "Alpha", value : this.alpha, step : 0.01},
            {min: 0.1, max: 60, step : 0.001, value: this.sigma, label: "Sigma C"}
        ]
        this.etfEigenvectorAnisotropicMap = new WebGLETFEigenvector(this.wgl, this.compiledFilters, this.framebufferPool);


    }

    public setAttributes (
        kernelSize : number,
        hardness : number,
        sharpness : number,
        zeta : number,
        zeroCrossing : number,
        alpha : number,
        sigma : number,
    ) {
        this.kernelSize = kernelSize;
        this.hardness = hardness;
        this.sharpness  = sharpness;
        this.zeta = zeta;
        this.zeroCrossing = zeroCrossing * (Math.PI / 8.0);
        this.alpha = alpha;
        this.sigma = sigma;
    }
    
    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer{
        /**
         * Uses 1 input Texture
         * @param inputTextures[0] is an image texture
        */
        const w : number = textureWidth;
        const h : number = textureHeight;
        const gray : WebGLGrayScale = this.compiledFilters.grayScale;
        const anisotropicKuwaharaPass : WebGLAnisotropicKuwaharaPass = this.compiledFilters.anisotropicKuwaharaPass;

        const grayFbo = gray.render([inputTextures[0]], w, h);
        
        this.etfEigenvectorAnisotropicMap.setAttributes(this.sigma);
        const etfFbo = this.etfEigenvectorAnisotropicMap.render([grayFbo.getTexture()], w, h);
        this.framebufferPool.release(grayFbo);

        anisotropicKuwaharaPass.setAttributes(this.kernelSize, this.hardness, this.sharpness, this.zeta, this.zeroCrossing, this.alpha);
        const anisotropicKuwaharaFbo = anisotropicKuwaharaPass.render([inputTextures[0], etfFbo.getTexture()], w, h);
        this.framebufferPool.release(etfFbo);

        return anisotropicKuwaharaFbo;
    }
}

export default WebGLAnisotropicKuwahara;