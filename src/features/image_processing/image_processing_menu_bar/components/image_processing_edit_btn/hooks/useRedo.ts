import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";

function useRedo() {
    const {rendererRef} = useContext(ImageProcessingContext);
    function handleRedo () {
        if (! rendererRef || ! rendererRef.current) return;
        
        rendererRef.current.holdCurrentTexture = rendererRef.current.historyStack.redo();
        rendererRef.current.currentTexture = rendererRef.current.holdCurrentTexture;
        rendererRef.current.renderScene();
    }
    return {handleRedo};
}

export default useRedo;