import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";
import WebGLPixelize from "../../../../../../utils/ShaderCodes/postprocessingEffects/nonCompositeTextures/webGLPixelize";

function usePixelize () {
    const {rendererRef, setSliderConfigs, setOpenFilterControl, filterFuncRef, setFilterName} = useContext(ImageProcessingContext);
    
    function handlePixelizeClick() {
        if (!rendererRef || ! rendererRef.current) return;
        const filterName : string ="Pixelize"; 
        setFilterName(filterName);
        setOpenFilterControl(() => true);

        const pixelize : WebGLPixelize = rendererRef.current.compiledFilters.pixelize;
        const renderer = rendererRef.current;
        
        setSliderConfigs([...pixelize.config]); // Helps initiate the slider(s)

        filterFuncRef.current = (config) => {
            let blockSize : number | undefined = config.find(cfg => cfg.label === "Block Size")?.value;
            
            if (blockSize  === undefined)  {
                console.warn("Block Size label was not found using initial value");
                blockSize = 2;
            }
            
            pixelize.setAttributes(blockSize);
            renderer.renderPipeline.addFilter(pixelize);
            renderer.currentTexture = renderer.renderPipeline.renderPass(renderer.holdCurrentTexture);
            renderer.renderScene();
        }

        filterFuncRef.current(pixelize.config); // Applies on click
    }
    return {handlePixelizeClick};
}

export default usePixelize;