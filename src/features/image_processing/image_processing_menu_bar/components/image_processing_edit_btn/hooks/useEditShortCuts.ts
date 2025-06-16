import { useEffect } from "react";
import useRedo from "./useRedo";
import useUndo from "./useUndo";

function useEditShortcuts () {
    const {handleRedo} = useRedo(); 
    const {handleUndo} = useUndo(); 

    useEffect(() => {
        function handleKeydown(event : KeyboardEvent) {
            const key = event.key.toLowerCase();

            if (!event.altKey && !event.shiftKey && event.ctrlKey && key == 'z') {
                event.preventDefault();
                handleUndo();
            }

            if(!event.altKey && event.ctrlKey && event.shiftKey && key == 'z'){
                event.preventDefault();
                handleRedo();
            }
        }

        

        window.addEventListener('keydown', handleKeydown);
    
        return(() => window.removeEventListener('keydown', handleKeydown));
    
    }, [handleRedo, handleUndo]);

    return {handleRedo, handleUndo};
}

export default useEditShortcuts;