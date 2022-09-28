import { PanelCollection, IDockviewPanelProps } from 'dockview';
import { createElement, FunctionComponent } from 'react';
import { Erb } from './Erb/Erb';
import { TextPanel } from './TextPanels/TextPanel';
import { HtmlTextPanel } from './TextPanels/HtmlTextPanel';
import { EditableHtmlTextPanel } from './TextPanels/EditableHtmlTextPanel';
import { ScriptureTextPanel } from './TextPanels/ScriptureTextPanel';

// TODO: Consider doing something a bit different with this https://stackoverflow.com/questions/29722270/is-it-possible-to-import-modules-from-all-files-in-a-directory-using-a-wildcard
/** All available panels for use in dockviews */
export const Panels = {
    Erb,
    TextPanel,
    HtmlTextPanel,
    EditableHtmlTextPanel,
    ScriptureTextPanel,
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
                createElement(panelComponent as FunctionComponent, params),
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
