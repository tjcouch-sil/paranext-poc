import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels, PanelFactory } from '@components/panels/Panels';
import { useCallback } from 'react';
import { TextPanelProps } from '@components/panels/TextPanels/TextPanel';
import { getScripture, getScriptureHtml } from '@services/ScriptureService';

const Layout = () => {
    const onReady = useCallback((event: DockviewReadyEvent) => {
        const erbAddInfo = PanelFactory.buildAddPanel('Erb', undefined, {
            title: 'ERB',
        });
        const textPanelAddInfo = PanelFactory.buildAddPanel(
            'TextPanel',
            {
                placeholderText: 'Loading Psalm 119 USX',
                textPromise: getScripture(19, 119),
            } as TextPanelProps,
            {
                title: 'zzz6: Psalm 119 USX',
                position: {
                    direction: 'right',
                    referencePanel: erbAddInfo.id,
                },
            },
        );
        const htmlTextPanelAddInfo = PanelFactory.buildAddPanel(
            'HtmlTextPanel',
            {
                placeholderText: 'Loading Psalm 119 HTML',
                textPromise: getScriptureHtml(19, 119),
            } as TextPanelProps,
            {
                title: 'zzz6: Psalm 119 HTML',
                position: {
                    direction: 'within',
                    referencePanel: textPanelAddInfo.id,
                },
            },
        );
        const erb = event.api.addPanel(erbAddInfo);
        const textPanel = event.api.addPanel(textPanelAddInfo);
        const htmlTextPanel = event.api.addPanel(htmlTextPanelAddInfo);

        event.api.getPanel(htmlTextPanelAddInfo.id)?.focus();

        // TODO: Figure out how to resize panels or do anything with them really
        setTimeout(
            () =>
                textPanel.api.setSize({
                    width: textPanel.api.width,
                    height: 100,
                }),
            1000,
        );
    }, []);

    return (
        <div className="layout">
            <DockviewReact
                className="dockview-theme-abyss"
                onReady={onReady}
                components={DockViewPanels}
            />
        </div>
    );
};
export default Layout;
