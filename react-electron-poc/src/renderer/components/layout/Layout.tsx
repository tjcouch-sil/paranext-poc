import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels, PanelFactory } from '@components/panels/Panels';
import { useCallback } from 'react';
import { TextPanelProps } from '@components/panels/TextPanels/TextPanel';
import { getScripture, getScriptureHtml } from '@services/ScriptureService';

const Layout = () => {
    const onReady = useCallback((event: DockviewReadyEvent) => {
        /* const erbAddInfo = PanelFactory.buildAddPanel('Erb', undefined, {
            title: 'ERB',
        }); */
        /* const textPanelAddInfo = PanelFactory.buildAddPanel(
            'TextPanel',
            {
                placeholderText: 'Loading zzz6 Psalm 119 USX',
                textPromise: getScripture('zzz6', 19, 119),
            } as TextPanelProps,
            {
                title: 'zzz6: Psalm 119 USX',
            },
        ); */
        const htmlTextPanelAddInfo = PanelFactory.buildAddPanel(
            'HtmlTextPanel',
            {
                placeholderText: 'Loading CSB Psalm 119 HTML',
                textPromise: getScriptureHtml('CSB', 19, 119),
            } as TextPanelProps,
            {
                title: 'CSB: Psalm 119 HTML',
            },
        );
        const htmlTextPanelAddInfoOHEB = PanelFactory.buildAddPanel(
            'HtmlTextPanel',
            {
                placeholderText: 'Loading OHEB Psalm 119 HTML',
                textPromise: getScriptureHtml('OHEB', 19, 119),
            } as TextPanelProps,
            {
                title: 'OHEB: Psalm 119 HTML',
                position: {
                    direction: 'right',
                    referencePanel: htmlTextPanelAddInfo.id,
                },
            },
        );
        const editableHtmlTextPanelAddInfo = PanelFactory.buildAddPanel(
            'EditableHtmlTextPanel',
            {
                placeholderText: 'Loading zzz6 Psalm 119 Editable HTML',
                textPromise: getScriptureHtml('zzz6', 19, 119),
            } as TextPanelProps,
            {
                title: 'zzz6: Psalm 119 Editable HTML',
                position: {
                    direction: 'below',
                    referencePanel: htmlTextPanelAddInfo.id,
                },
            },
        );
        /* const erb = event.api.addPanel(erbAddInfo); */
        /* const textPanel = event.api.addPanel(textPanelAddInfo); */
        const htmlTextPanel = event.api.addPanel(htmlTextPanelAddInfo);
        const htmlTextPanelOHEB = event.api.addPanel(htmlTextPanelAddInfoOHEB);
        const editableHtmlTextPanel = event.api.addPanel(
            editableHtmlTextPanelAddInfo,
        );
        event.api.addPanel(
            PanelFactory.buildAddPanel(
                'HtmlTextPanel',
                {
                    placeholderText: 'Loading NIV84 Psalm 119 HTML',
                    textPromise: getScriptureHtml('NIV84', 19, 119),
                } as TextPanelProps,
                {
                    title: 'NIV84: Psalm 119 HTML',
                    position: {
                        direction: 'below',
                        referencePanel: htmlTextPanelAddInfoOHEB.id,
                    },
                },
            ),
        );
        event.api.addPanel(
            PanelFactory.buildAddPanel(
                'EditableHtmlTextPanel',
                {
                    placeholderText: 'Loading zzz1 Psalm 119 Editable HTML',
                    textPromise: getScriptureHtml('zzz1', 19, 119),
                } as TextPanelProps,
                {
                    title: 'zzz1: Psalm 119 Editable HTML',
                    position: {
                        direction: 'below',
                        referencePanel: htmlTextPanelAddInfoOHEB.id,
                    },
                },
            ),
        );

        event.api.getPanel(htmlTextPanelAddInfo.id)?.focus();

        // TODO: Figure out how to resize panels or do anything with them really
        /* setTimeout(
            () =>
                textPanel.api.setSize({
                    width: textPanel.api.width,
                    height: 100,
                }),
            1000,
        ); */
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
