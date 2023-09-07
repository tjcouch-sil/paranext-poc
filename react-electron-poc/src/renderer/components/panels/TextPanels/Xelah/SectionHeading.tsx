import { PropsWithoutRef, useEffect } from 'react';

type SectionHeadingProps = PropsWithoutRef<{
    type: unknown;
    content: string;
    show?: boolean;
    index?: number;
    verbose?: boolean;
}>;

export default function SectionHeading({
    type: _type,
    content,
    show,
    index,
    verbose,
    ...props
}: SectionHeadingProps) {
    useEffect(() => {
        if (verbose) console.log('SectionHeading: Mount/First Render', index);
        return () => {
            if (verbose)
                console.log('SectionHeading: UnMount/Destroyed', index);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const matchRes = content.match(/<span class="mark[^"]+chapter-(\d+)/);
    const foundChNum = matchRes && matchRes[1];
    const chNum = foundChNum || 0;
    const type = foundChNum ? `Chapter ${chNum}` : 'Title & Introduction';

    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <div className="sectionHeading" data-chapter-number={chNum} {...props}>
            <span className="expand">
                {show ? '' : '...'}
                {type}
                {show ? '' : '...'}
            </span>
        </div>
    );
}
