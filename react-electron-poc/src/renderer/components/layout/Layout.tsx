import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels, PanelFactory } from '@components/panels/Panels';
import { useCallback } from 'react';
import { TextPanelProps } from '@components/panels/TextPanels/TextPanel';
import {
    getAllResourceInfo,
    getResourceInfo,
    getScriptureHtml,
} from '@services/ScriptureService';

const Layout = () => {
    const onReady = useCallback((event: DockviewReadyEvent) => {
        // Test resource info api
        getAllResourceInfo()
            .then((allResourceInfo) =>
                console.log(
                    `All Resource Info:\n${allResourceInfo
                        .map(
                            (resourceInfo) =>
                                `\tResource: ${resourceInfo.shortName}${
                                    resourceInfo.editable ? ' editable' : ''
                                }`,
                        )
                        .join('\n')}`,
                ),
            )
            .catch((r) => console.log(r));
        getResourceInfo('zzz6')
            .then((resourceInfo) =>
                console.log(
                    `Resource: ${resourceInfo.shortName}${
                        resourceInfo.editable ? ' editable' : ''
                    }`,
                ),
            )
            .catch((r) => console.log(r));

        const panelFactory = new PanelFactory(event);
        /* const erb = panelFactory.addPanel('Erb', undefined, {
            title: 'ERB',
        }); */
        /* const textPanel = panelFactory.addPanel(
            'TextPanel',
            {
                placeholderText: 'Loading zzz6 Psalm 119 USX',
                textPromise: getScripture('zzz6', 19, 119),
            } as TextPanelProps,
            {
                title: 'zzz6: Psalm 119 USX',
            },
        ); */
        const htmlTextPanel = panelFactory.addPanel(
            'HtmlTextPanel',
            {
                placeholderText: 'Loading CSB Psalm 119 HTML',
                textPromise: getScriptureHtml('CSB', 19, 119).then(
                    (result) => result[0],
                ),
            } as TextPanelProps,
            {
                title: 'CSB: Psalm 119 HTML',
            },
        );
        const htmlTextPanelOHEB = panelFactory.addPanel(
            'HtmlTextPanel',
            {
                placeholderText: 'Loading OHEB Psalm 119 HTML',
                textPromise: getScriptureHtml('OHEB', 19, 119).then(
                    (result) => result[0],
                ),
            } as TextPanelProps,
            {
                title: 'OHEB: Psalm 119 HTML',
                position: {
                    direction: 'right',
                    referencePanel: htmlTextPanel.id,
                },
            },
        );
        const editableHtmlTextPanel = panelFactory.addPanel(
            'EditableHtmlTextPanel',
            {
                placeholderText: 'Loading zzz6 Psalm 119 Editable HTML',
                textPromise: getScriptureHtml('zzz6', 19, 119).then(
                    (result) => result[0],
                ),
            } as TextPanelProps,
            {
                title: 'zzz6: Psalm 119 Editable HTML',
                position: {
                    direction: 'below',
                    referencePanel: htmlTextPanel.id,
                },
            },
        );
        panelFactory.addPanel(
            'HtmlTextPanel',
            {
                placeholderText: 'Loading NIV84 Psalm 119 HTML',
                textPromise: getScriptureHtml('NIV84', 19, 119).then(
                    (result) => result[0],
                ),
            } as TextPanelProps,
            {
                title: 'NIV84: Psalm 119 HTML',
                position: {
                    direction: 'below',
                    referencePanel: htmlTextPanelOHEB.id,
                },
            },
        );
        panelFactory.addPanel(
            'EditableHtmlTextPanel',
            {
                placeholderText: 'Loading zzz1 Psalm 119 Editable HTML',
                textPromise: getScriptureHtml('zzz1', 19, 119).then(
                    (result) => result[0],
                ),
            } as TextPanelProps,
            {
                title: 'zzz1: Psalm 119 Editable HTML',
                position: {
                    direction: 'below',
                    referencePanel: htmlTextPanelOHEB.id,
                },
            },
        );

        event.api.getPanel(htmlTextPanel.id)?.focus();

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
