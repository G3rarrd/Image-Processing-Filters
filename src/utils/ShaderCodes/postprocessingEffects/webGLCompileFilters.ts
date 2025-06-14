import WebGLBinaryThreshold from './nonCompositeTextures/webGLBinaryThresholding';
import WebGLEmboss from './nonCompositeTextures/webGLEmboss';
import WebGLGrayScale from './nonCompositeTextures/webGLGrayscale';
import WebGLInvert from './nonCompositeTextures/webGLInvert';
import WebGLGaussianBlurPass from './nonCompositeTextures/webGLGaussianBlurPass';
import WebGLQuantization from './nonCompositeTextures/webGLQuantization';
import WebGLDithering from './nonCompositeTextures/webGLDithering';
import WebGLSubtract from './nonCompositeTextures/webGLSubtract';
import WebGLXDoGThreshold from './nonCompositeTextures/webGLXDoGThreshold';
import WebGLTanhThreshold from './nonCompositeTextures/WebGLTanhThreshold';
import WebGLEdgeBlurPass from './nonCompositeTextures/webGLEdgeBlur';
import WebGLEigenvector from './nonCompositeTextures/webGLEigenvector';
import WebGLETFSmoothingPass from './nonCompositeTextures/webGLETFSmoothingPass';
import WebGLFlowField from './nonCompositeTextures/webGLFlowField';
import WebGLSuperImpose from './nonCompositeTextures/webGLSuperImpose';
import WebGLPixelize from './nonCompositeTextures/webGLPixelize';
import WebGLSubtractFDoG from './nonCompositeTextures/webGLSubtractFDoG';
import WebGLGradientAlignedBilateral from './nonCompositeTextures/webGLGradientAlignedBilateralFilter';
import WebGLCore from '../../webGLCore';
import WebGLSobel from './nonCompositeTextures/webGLSobel';
import WebGLSharpen from './nonCompositeTextures/webGLSharpen';
import FramebufferPool from '../../framebuffer_textures/framebufferPool';
import WebGLStreamlineBlur from './nonCompositeTextures/webGLStreamlineBlur';
import WebGLStructuredTensor from './nonCompositeTextures/webGLStructuredTensor';
import WebGLStreamlineBilateral from './nonCompositeTextures/webGLStreamLineBilateral';
import WebGLKuwahara from './nonCompositeTextures/webGLKuwahara';
import WebGLGeneralizedKuwahara from './nonCompositeTextures/webGLGeneralizedKuwahara';

class WebGLCompileFilters {
    public readonly grayScale : WebGLGrayScale;
    public readonly invert : WebGLInvert;
    public readonly binaryThreshold : WebGLBinaryThreshold;
    public readonly emboss : WebGLEmboss;
    public readonly gaussianBlurPass : WebGLGaussianBlurPass;
    public readonly quantization : WebGLQuantization;
    public readonly dithering : WebGLDithering;
    public readonly subtract : WebGLSubtract;
    public readonly xdogThreshold : WebGLXDoGThreshold;
    public readonly tanhThreshold : WebGLTanhThreshold;
    public readonly edgeBlurPass : WebGLEdgeBlurPass;
    public readonly eigenvector : WebGLEigenvector;
    public readonly etfSmoothingPass : WebGLETFSmoothingPass;
    public readonly flowField : WebGLFlowField;
    public readonly superImpose : WebGLSuperImpose;
    public readonly pixelize : WebGLPixelize;
    public readonly subtractFDoG : WebGLSubtractFDoG;
    public readonly gradientAlignedBilateral : WebGLGradientAlignedBilateral;
    public readonly sobel : WebGLSobel;
    public readonly sharpen : WebGLSharpen;
    public readonly streamlineBlur : WebGLStreamlineBlur;
    public readonly streamlineBilateral : WebGLStreamlineBilateral;
    public readonly structuredTensor : WebGLStructuredTensor;
    public readonly kuwahara : WebGLKuwahara;
    public readonly generalizedKuwahara : WebGLGeneralizedKuwahara;

    public readonly allFilters: { init: () => void }[];

    constructor (wgl : WebGLCore, framebufferPool : FramebufferPool) {
        this.grayScale = new WebGLGrayScale(wgl, framebufferPool);
        this.invert = new WebGLInvert(wgl, framebufferPool);
        this.binaryThreshold = new WebGLBinaryThreshold(wgl, framebufferPool);
        this.emboss = new WebGLEmboss(wgl, framebufferPool);
        this.gaussianBlurPass = new WebGLGaussianBlurPass(wgl, framebufferPool);
        this.quantization = new WebGLQuantization(wgl, framebufferPool);
        this.dithering = new WebGLDithering(wgl, framebufferPool);
        this.subtract = new WebGLSubtract(wgl, framebufferPool);
        this.xdogThreshold = new WebGLXDoGThreshold(wgl, framebufferPool);
        this.tanhThreshold = new WebGLTanhThreshold(wgl, framebufferPool);
        this.edgeBlurPass = new WebGLEdgeBlurPass(wgl, framebufferPool);
        this.eigenvector = new WebGLEigenvector(wgl, framebufferPool);
        this.etfSmoothingPass = new WebGLETFSmoothingPass(wgl, framebufferPool);
        this.flowField = new WebGLFlowField(wgl, framebufferPool);
        this.superImpose = new WebGLSuperImpose(wgl, framebufferPool);
        this.pixelize = new WebGLPixelize(wgl, framebufferPool);
        this.subtractFDoG = new WebGLSubtractFDoG(wgl, framebufferPool);
        this.gradientAlignedBilateral = new WebGLGradientAlignedBilateral(wgl, framebufferPool);
        this.sobel = new WebGLSobel(wgl, framebufferPool);
        this.sharpen = new WebGLSharpen(wgl, framebufferPool);
        this.streamlineBlur = new WebGLStreamlineBlur(wgl, framebufferPool);
        this.streamlineBilateral = new WebGLStreamlineBilateral(wgl, framebufferPool);
        this.structuredTensor = new WebGLStructuredTensor(wgl, framebufferPool);
        this.kuwahara = new WebGLKuwahara(wgl, framebufferPool);
        this.generalizedKuwahara = new WebGLGeneralizedKuwahara(wgl, framebufferPool);

        this.allFilters = [
        this.grayScale,
        this.invert,
        this.binaryThreshold,
        this.emboss,
        this.gaussianBlurPass,
        this.quantization,
        this.dithering,
        this.subtract,
        this.xdogThreshold,
        this.tanhThreshold,
        this.edgeBlurPass,
        this.eigenvector,
        this.etfSmoothingPass,
        this.flowField,
        this.superImpose,
        this.pixelize,
        this.subtractFDoG,
        this.gradientAlignedBilateral,
        this.streamlineBilateral,
        this.sobel,
        this.sharpen,
        this.streamlineBlur,
        this.structuredTensor,
        this.kuwahara,
        this.generalizedKuwahara,
        ];
    }

    public initAll () {
        /* To compile all the non composite filters once per image program used */
        for (const filter of this.allFilters) {
            filter.init();
        }   
    }
}

export default WebGLCompileFilters;