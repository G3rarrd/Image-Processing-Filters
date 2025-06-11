import { useContext } from "react";
import { ImageProcessingContext } from '../../../../components/image_processing_context/image_processing_provider';
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";
import { m3 } from "../../../../../../utils/math/webGLMatrix3";

function useFitArea () {
    const {rendererRef} = useContext(ImageProcessingContext);

    const handleFitAreaClick = () => {
        if (! rendererRef || ! rendererRef.current) return;
        const renderer : WebGLRenderer = rendererRef.current;
        const imgWidth : number = renderer.img.naturalWidth;
        const imgHeight : number = renderer.img.naturalHeight;
        renderer.cam.viewProjection = m3.identity();
        renderer.cam.resetCamera(imgWidth, imgHeight);
        renderer.cam.setViewProjection();
        renderer.renderScene();
    } 

    return {handleFitAreaClick};
}

export default useFitArea;