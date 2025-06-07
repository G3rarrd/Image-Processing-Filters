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
    public readonly allFilters: { init: () => void }[];

    constructor (wgl : WebGLCore) {
        this.grayScale = new WebGLGrayScale(wgl);
        this.invert = new WebGLInvert(wgl);
        this.binaryThreshold = new WebGLBinaryThreshold(wgl);
        this.emboss = new WebGLEmboss(wgl);
        this.gaussianBlurPass = new WebGLGaussianBlurPass(wgl);
        this.quantization = new WebGLQuantization(wgl);
        this.dithering = new WebGLDithering(wgl);
        this.subtract = new WebGLSubtract(wgl);
        this.xdogThreshold = new WebGLXDoGThreshold(wgl);
        this.tanhThreshold = new WebGLTanhThreshold(wgl);
        this.edgeBlurPass = new WebGLEdgeBlurPass(wgl);
        this.eigenvector = new WebGLEigenvector(wgl);
        this.etfSmoothingPass = new WebGLETFSmoothingPass(wgl);
        this.flowField = new WebGLFlowField(wgl);
        this.superImpose = new WebGLSuperImpose(wgl);
        this.pixelize = new WebGLPixelize(wgl);
        this.subtractFDoG = new WebGLSubtractFDoG(wgl);
        this.gradientAlignedBilateral = new WebGLGradientAlignedBilateral(wgl);
        this.sobel = new WebGLSobel(wgl);
        this.sharpen = new WebGLSharpen(wgl);


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
        this.sobel,
        this.sharpen,
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