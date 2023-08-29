import { PropsWithChildren, ReactNode } from 'react';
import { Accordion } from '@mui/material';

type SectionProps = PropsWithChildren<{
    show?: boolean;
    dir?: string;
}>;

export default function Section({
    children,
    show,
    dir,
    ...props
}: SectionProps) {
    return (
        <Accordion
            TransitionProps={{ unmountOnExit: true }}
            expanded={show}
            className={`section ${dir}`}
            dir={dir}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        >
            {children as NonNullable<ReactNode> & ReactNode}
        </Accordion>
    );
}
