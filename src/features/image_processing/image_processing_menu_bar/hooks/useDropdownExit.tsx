import { useEffect } from "react"
/**
 * Ensures open menus are closed when clicked outside the parent div
 * */ 
export function useDropdownExit(
    ref : React.RefObject<HTMLElement>, 
    onOutsideClickAction: () => void
) {
    function handleClick (e : MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            onOutsideClickAction();
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    
    }, [ref, onOutsideClickAction]);
}