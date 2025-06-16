import { useContext } from "react";
import { ImageProcessingContext } from "../../../../components/image_processing_context/image_processing_provider";

function useUndo() {
    const {rendererRef} = useContext(ImageProcessingContext);
    function handleUndo () {
        if (! rendererRef || ! rendererRef.current) return;
        
        rendererRef.current.holdCurrentTexture = rendererRef.current.historyStack.undo();
        rendererRef.current.currentTexture = rendererRef.current.holdCurrentTexture;
        rendererRef.current.renderScene();
    }
    return {handleUndo};
}

export default useUndo;