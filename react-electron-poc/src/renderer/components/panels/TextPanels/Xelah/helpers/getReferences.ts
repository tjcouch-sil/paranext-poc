export const getCurrentVerse = (
    currentNode: Node | undefined,
): string | undefined => {
    let currentVerse: string | undefined;
    let prev = (currentNode as HTMLElement)
        ?.previousElementSibling as HTMLElement;

    while (prev) {
        if (prev.dataset.type === 'mark' && prev.dataset.subtype === 'verses') {
            currentVerse = prev.dataset.attsNumber;
            break;
        }

        // Get the previous sibling
        prev = prev.previousElementSibling as HTMLElement;
    }
    return currentVerse;
};

export const getCurrentChapter = (
    currentNode: Node | undefined,
): string | undefined => {
    let currentChapter: string | undefined;
    const accordionElement =
        currentNode?.parentElement?.closest('.MuiAccordion-root');
    if (accordionElement) {
        const headingElement =
            accordionElement.querySelector('.sectionHeading');
        if (headingElement) {
            currentChapter = (headingElement as HTMLElement).dataset
                .chapterNumber;
        }
    }
    return currentChapter;
};
