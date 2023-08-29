import { PropsWithChildren } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { AccordionDetails } from '@mui/material';

type SectionBodyProps = PropsWithChildren<{
    show?: boolean;
}>;

export default function SectionBody({
    children,
    show,
    ...props
}: SectionBodyProps) {
    return useDeepCompareMemo(() => {
        let component = <></>;
        if (show) {
            component = (
                // eslint-disable-next-line react/jsx-props-no-spreading
                <AccordionDetails className="sectionBody" {...props}>
                    {children}
                </AccordionDetails>
            );
        }
        return component;
    }, [show, props, children]);
}
