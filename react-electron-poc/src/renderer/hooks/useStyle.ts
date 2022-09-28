import { useEffect, useRef } from 'react';

/** Awaits a promise to get styles and applies them when resolved.
 * @param promiseFactoryCallback a function that returns the promise to await. If the promise resolves to null, the value will not change.
 *      WARNING: MUST BE WRAPPED IN A useCallback. The reference must not be updated every render
 */
export default (promiseFactoryCallback: () => Promise<string | undefined>) => {
    // TODO: Consider doing the useCallback in here and enabling react-hooks/exhaustive-deps on this hook https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks#advanced-configuration
    const stylePrev = useRef<string | undefined>(undefined);
    useEffect(() => {
        let promiseIsCurrent = true;
        let styleElement: HTMLStyleElement;
        (async () => {
            const style = await promiseFactoryCallback();
            if (promiseIsCurrent) {
                // If the styles haven't changed, we don't need to do anything
                if (stylePrev.current === style) return;
                stylePrev.current = style;

                // If there are no styles, we don't need to do anything
                if (!style) return;

                const start = performance.now();

                // Add styles to document
                styleElement = document.createElement('style');
                styleElement.appendChild(document.createTextNode(style));
                document.head.appendChild(styleElement);

                console.log(
                    `Style apply time: ${performance.now() - start} ms`,
                );
            }
        })();

        return () => {
            // If the style was added, remove it
            if (styleElement) {
                const start = performance.now();

                // Remove styles
                document.head.removeChild(styleElement);

                console.log(
                    `Style remove time: ${performance.now() - start} ms`,
                );
            }
            // Mark this promise as old and not to be used
            promiseIsCurrent = false;
        };
    }, [promiseFactoryCallback]);
};
