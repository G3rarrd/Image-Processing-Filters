import { useEffect } from "react";
import useFitArea from "./useFitArea";
import useZoomIn from "./useZoomIn";
import useZoomOut from "./useZoomOut";

function useGlobalViewShortcuts () {
    const {handleFitAreaClick} = useFitArea();
    const {handleZoomIn} = useZoomIn();
    const {handleZoomOut} = useZoomOut();

    useEffect(() => {
        function handleKeyDown (event : KeyboardEvent) {
            const key = event.key.toLowerCase();
            const isCtrl = event.ctrlKey || event.metaKey;

            if (!isCtrl) return;

            switch(key) {
                case '0':
                    event.preventDefault();
                    handleFitAreaClick();
                    break;
                case '=':
                    case '+':
                        event.preventDefault();
                        handleZoomIn();
                        break;
                case '-':
                    case '_':
                        event.preventDefault();
                        handleZoomOut();
                        break;
                default:
                    break;
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleZoomIn, handleZoomOut, handleFitAreaClick]);

    return {handleZoomIn, handleZoomOut, handleFitAreaClick};
};

export default useGlobalViewShortcuts;