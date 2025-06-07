import React, { ReactNode } from "react";

import styles from './image_processing_page_layout.module.css';
import ImageProcessingMenuBar from "../../features/image_processing/image_processing_menu_bar/components/image_processing_menu_bar";

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