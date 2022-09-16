import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels, PanelFactory } from '@components/panels/Panels';
import { useCallback, useState } from 'react';
import {
    getAllResourceInfo,
    getResourceInfo,
} from '@services/ScriptureService';
import { ScriptureTextPanelProps } from '@components/panels/TextPanels/ScriptureTextPanel';
import { ScriptureReference } from '@shared/data/ScriptureTypes';

const Layout = () => {
    const [scrRef, setScrRef] = useState<ScriptureReference>({
        book: 19,
        chapter: 119,
        verse: 1,
    });

    const onReady = useCallback(
        (event: DockviewReadyEvent) => {
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
            const csbPanel = panelFactory.addPanel(
                'ScriptureTextPanel',
                {
                    shortName: 'CSB',
                    editable: false,
                    ...scrRef,
                } as ScriptureTextPanelProps,
                {
                    title: 'CSB: Psalm 119 HTML',
                },
            );
            const ohebPanel = panelFactory.addPanel(
                'ScriptureTextPanel',
                {
                    shortName: 'OHEB',
                    editable: false,
                    ...scrRef,
                } as ScriptureTextPanelProps,
                {
                    title: 'OHEB: Psalm 119 HTML',
                    position: {
                        direction: 'right',
                        referencePanel: csbPanel.id,
                    },
                },
            );
            panelFactory.addPanel(
                'ScriptureTextPanel',
                {
                    shortName: 'zzz6',
                    editable: true,
                    ...scrRef,
                } as ScriptureTextPanelProps,
                {
                    title: 'zzz6: Psalm 119 Editable HTML',
                    position: {
                        direction: 'below',
                        referencePanel: csbPanel.id,
                    },
                },
            );
            panelFactory.addPanel(
                'ScriptureTextPanel',
                {
                    shortName: 'NIV84',
                    editable: false,
                    ...scrRef,
                } as ScriptureTextPanelProps,
                {
                    title: 'NIV84: Psalm 119 HTML',
                    position: {
                        direction: 'below',
                        referencePanel: ohebPanel.id,
                    },
                },
            );
            panelFactory.addPanel(
                'ScriptureTextPanel',
                {
                    shortName: 'zzz1',
                    editable: true,
                    ...scrRef,
                } as ScriptureTextPanelProps,
                {
                    title: 'zzz1: Psalm 119 Editable HTML',
                    position: {
                        direction: 'below',
                        referencePanel: ohebPanel.id,
                    },
                },
            );

            event.api.getPanel(csbPanel.id)?.focus();

            // TODO: Figure out how to resize panels or do anything with them really
            /* setTimeout(
            () =>
                textPanel.api.setSize({
                    width: textPanel.api.width,
                    height: 100,
                }),
            1000,
        ); */
        },
        [scrRef],
    );

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
