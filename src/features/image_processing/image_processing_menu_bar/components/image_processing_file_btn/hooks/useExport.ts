import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLRenderer from "../../../../../../utils/Scene/webGLRender";
import WebGLImageExporter from "../../../../../../utils/webGLImageExporter";

function useExport (fileName : string) {
    const {rendererRef}= useContext(ImageProcessingContext);
    function handleExport () {
        if(! rendererRef || ! rendererRef.current) return;

        const renderer : WebGLRenderer = rendererRef.current;
        const img : HTMLImageElement = renderer.img;
        const download : WebGLImageExporter = new WebGLImageExporter(renderer.gl);
        download.export(renderer.currentTexture, img.naturalWidth, img.naturalHeight, fileName);
    }

    return {handleExport};
}

export default useExport;