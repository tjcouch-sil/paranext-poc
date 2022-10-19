import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels } from '@components/panels/Panels';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getAllResourceInfo,
    getResourceInfo,
} from '@services/ScriptureService';
import { ScriptureTextPanelHtmlProps } from '@components/panels/TextPanels/ScriptureTextPanelHtml';
import { ScriptureReference } from '@shared/data/ScriptureTypes';
import ScrRefSelector from '@components/ScrRefSelector';
import { PanelManager } from '@components/panels/PanelManager';
import { getSetting, setSetting } from '@services/SettingsService';
import { offsetChapter, offsetVerse } from '@util/ScriptureUtil';
import isHotkey from 'is-hotkey';
import { ScriptureTextPanelSlate } from '@components/panels/TextPanels/ScriptureTextPanelSlate';

/** Key for saving scrRef setting */
const scrRefSettingKey = 'scrRef';
/** Key for saving browseBook setting */
const useVirtualizationSettingKey = 'useVirtualization';
/** Key for saving browseBook setting */
const browseBookSettingKey = 'browseBook';

const isHotkeyPreviousChapter = isHotkey('mod+alt+ArrowUp');
const isHotkeyNextChapter = isHotkey('mod+alt+ArrowDown');
const isHotkeyPreviousVerse = isHotkey('mod+alt+ArrowLeft');
const isHotkeyNextVerse = isHotkey('mod+alt+ArrowRight');

const Layout = () => {
    const panelManager = useRef<PanelManager | undefined>(undefined);

    const [scrRef, setScrRef] = useState<ScriptureReference>(
        getSetting<ScriptureReference>(scrRefSettingKey) || {
            book: 19,
            chapter: 119,
            verse: 1,
        },
    );
    const updateScrRef = useCallback((newScrRef: ScriptureReference) => {
        setScrRef(newScrRef);
        setSetting(scrRefSettingKey, newScrRef);

        panelManager.current?.updateScrRef(newScrRef);
    }, []);

    const [useVirtualization, setUseVirtualization] = useState<boolean>(
        getSetting<boolean>(useVirtualizationSettingKey) || false,
    );
    const updateUseVirtualization = useCallback(
        (newUseVirtualization: boolean) => {
            setUseVirtualization(newUseVirtualization);
            setSetting(useVirtualizationSettingKey, newUseVirtualization);

            panelManager.current?.updateUseVirtualization(newUseVirtualization);
        },
        [],
    );

    const [browseBook, setBrowseBook] = useState<boolean>(
        getSetting<boolean>(browseBookSettingKey) || false,
    );
    const updateBrowseBook = useCallback((newBrowseBook: boolean) => {
        setBrowseBook(newBrowseBook);
        setSetting(browseBookSettingKey, newBrowseBook);

        panelManager.current?.updateBrowseBook(newBrowseBook);
    }, []);

    /** Handle keyboard events for the whole application */
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (isHotkeyPreviousChapter(event)) {
                updateScrRef(offsetChapter(scrRef, -1));
            } else if (isHotkeyNextChapter(event)) {
                updateScrRef(offsetChapter(scrRef, 1));
            } else if (isHotkeyPreviousVerse(event)) {
                updateScrRef(offsetVerse(scrRef, -1));
            } else if (isHotkeyNextVerse(event)) {
                updateScrRef(offsetVerse(scrRef, 1));
            }
        };

        window.addEventListener('keydown', onKeyDown, true);

        return () => {
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }, [scrRef, updateScrRef]);

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

            panelManager.current = new PanelManager(event);
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
            const csbPanel = panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'CSB',
                    editable: false,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelHtmlProps,
            );
            const ohebPanel = panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'OHEB',
                    editable: false,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelHtmlProps,
                {
                    position: {
                        direction: 'right',
                        referencePanel: csbPanel.id,
                    },
                },
            );
            panelManager.current.addPanel(
                'ScriptureTextPanelSlate',
                {
                    shortName: 'zzz6',
                    editable: true,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelHtmlProps,
                {
                    position: {
                        direction: 'below',
                        referencePanel: csbPanel.id,
                    },
                },
            );
            panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'NIV84',
                    editable: false,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelHtmlProps,
                {
                    position: {
                        direction: 'below',
                        referencePanel: ohebPanel.id,
                    },
                },
            );
            const zzz1Panel = panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'zzz1',
                    editable: true,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelHtmlProps,
                {
                    position: {
                        direction: 'below',
                        referencePanel: ohebPanel.id,
                    },
                },
            );
            panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'zzz6',
                    editable: true,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelHtmlProps,
                {
                    position: {
                        direction: 'within',
                        referencePanel: zzz1Panel.id,
                    },
                },
            );
        },
        [scrRef, updateScrRef, useVirtualization, browseBook],
    );

    return (
        <div className="layout">
            <div className="layout-bar">
                <ScrRefSelector scrRef={scrRef} handleSubmit={updateScrRef} />
                <span className="settings">
                    <span className="layout-checkbox">
                        Use Virtualization
                        <input
                            type="checkbox"
                            checked={useVirtualization}
                            onChange={(event) =>
                                updateUseVirtualization(event.target.checked)
                            }
                        />
                    </span>
                    <span className="layout-checkbox">
                        Edit whole book
                        <input
                            type="checkbox"
                            checked={browseBook}
                            onChange={(event) =>
                                updateBrowseBook(event.target.checked)
                            }
                        />
                    </span>
                </span>
            </div>
            <div className="layout-dock">
                <DockviewReact
                    className="dockview-theme-abyss"
                    onReady={onReady}
                    components={DockViewPanels}
                />
            </div>
        </div>
    );
};
export default Layout;
