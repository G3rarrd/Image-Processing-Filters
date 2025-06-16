import { useEffect } from "react"
/**
 * Ensures open menus are closed when clicked outside the parent div
 * */ 
export function useDropdownExit(
    ref : React.RefObject<HTMLElement>, 
    onOutsideClick: () => void
) {
    function handleClick (e : MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            onOutsideClick();
        }
    }
    
    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    
    }, [ref, onOutsideClick]);
}