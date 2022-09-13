import { useEffect } from 'react';

export default (styles: string) => {
    useEffect(() => {
        // TODO: Could potentially improve by checking style vs previous style, though useEffect may already be doing this. Worth considering
        // If there are no styles, we don't need to do anything
        if (!styles) return;

        let start = performance.now();

        // Add styles to document
        const styleElement = document.createElement('style');
        styleElement.appendChild(document.createTextNode(styles));
        document.head.appendChild(styleElement);

        console.log(`Style apply time: ${performance.now() - start} ms`);

        // eslint-disable-next-line consistent-return
        return () => {
            start = performance.now();

            // Remove styles
            document.head.removeChild(styleElement);

            console.log(`Style remove time: ${performance.now() - start} ms`);
        };
    }, [styles]);
};
