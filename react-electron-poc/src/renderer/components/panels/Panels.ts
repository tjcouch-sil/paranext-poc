import {
    PanelCollection,
    IDockviewPanelProps,
    AddPanelOptions,
} from 'dockview';
import React from 'react';
import { newGuid } from '@util/Util';
import { Erb } from './Erb/Erb';
import { TextPanel } from './TextPanel/TextPanel';

/** All available panels for use in dockviews */
export const Panels = {
    Erb,
    TextPanel,
};
export default Panels;

/** Names of all panels to use in dockviews */
export type PanelType = keyof typeof Panels;

/** DockView functions to create each panel */
export const DockViewPanels: PanelCollection<IDockviewPanelProps> =
    Object.fromEntries(
        Object.entries(Panels).map(([panelType, panelComponent]) => [
            panelType,
            ({ params }: IDockviewPanelProps) =>
                React.createElement(panelComponent, params),
        ]),
    );
/* const DockViewPanels: PanelCollection<IDockviewPanelProps> = {
    Erb: ({ params }: IDockviewPanelProps<ErbProps>) => {
    // eslint-disable-next-line react/jsx-props-no-spreading
        return <Erb {...params} />;
    },
    TextPanel: ({ params }: IDockviewPanelProps<TextPanelProps>) => {
    // eslint-disable-next-line react/jsx-props-no-spreading
        return <TextPanel {...params} />;
    },
}; */

/** Dockview Panel builder for our panels */
export class PanelFactory {
    /** Returns AddPanelOptions for the specified input */
    static buildAddPanel(
        panelType: PanelType,
        panelProps: { [prop: string]: unknown } = {},
        addPanelOptions: Omit<
            AddPanelOptions,
            'id' | 'component' | 'params'
        > = {},
    ): AddPanelOptions {
        return {
            ...addPanelOptions,
            id: newGuid(),
            component: panelType,
            params: { ...panelProps },
        };
    }
}
