import React, { ReactNode } from "react";
import styles from './image_processing_page_layout.module.css';

const ImageProcessingPageLayout : React.FC<{children : ReactNode}> = ({children}) => {
    return (
    <>
    <header className={`${styles.header}`}>LumenFX</header>
    
    <main className={`${styles.image_processing_main}`}>
        {children}
    </main>
    </>
    );
}

export default ImageProcessingPageLayout;