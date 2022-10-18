import './Layout.css';
import { DockviewReact, DockviewReadyEvent, IDockviewPanel } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels } from '@components/panels/Panels';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getAllResourceInfo,
    getResourceInfo,
} from '@services/ScriptureService';
import { ScriptureTextPanelStringProps } from '@components/panels/TextPanels/ScriptureTextPanelHtml';
import { ResourceInfo, ScriptureReference } from '@shared/data/ScriptureTypes';
import ScrRefSelector from '@components/ScrRefSelector';
import {
    AddPanelType,
    DIRECTIONS,
    PanelManager,
    PANEL_TYPE_RANDOM_SCRIPTURE,
} from '@components/panels/PanelManager';
import { getSetting, setSetting } from '@services/SettingsService';
import { offsetChapter, offsetVerse } from '@util/ScriptureUtil';
import isHotkey from 'is-hotkey';
import { ScriptureTextPanelSlateProps } from '@components/panels/TextPanels/ScriptureTextPanelSlate';
import { isValidValue } from '@util/Util';

/** Key for saving scrRef setting */
const scrRefSettingKey = 'scrRef';
/** Key for saving browseBook setting */
const useVirtualizationSettingKey = 'useVirtualization';
/** Key for saving browseBook setting */
const browseBookSettingKey = 'browseBook';
/** Key for saving startingTabs setting */
const startingTabsSettingKey = 'startingTabs';

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

    const [startingTabs, setStartingTabs] = useState<number>(() => {
        const startingTabsSaved = getSetting<number>(startingTabsSettingKey);
        if (isValidValue(startingTabsSaved)) return startingTabsSaved;
        return 5;
    });
    const updateStartingTabs = useCallback((newStartingTabs: number) => {
        if (newStartingTabs < 0 || newStartingTabs >= 100) return;

        setStartingTabs(newStartingTabs);
        setSetting(startingTabsSettingKey, newStartingTabs);
    }, []);

    /** All Resource Information on available resources */
    const allResourceInfo = useRef<ResourceInfo[]>([]);

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

    const addTab = useCallback(
        (panelType: AddPanelType = PANEL_TYPE_RANDOM_SCRIPTURE) => {
            if (panelManager.current) {
                // Get all resources that are open and are editable (don't want two of the same resource open for now)
                const resourcesInUse: Set<string> = new Set<string>();

                const panelsInfo = Array.from(
                    panelManager.current.panelsInfo.values(),
                );
                // eslint-disable-next-line no-restricted-syntax
                panelsInfo.forEach((panelInfo) => {
                    const panelProps =
                        // We just checked that panelManager.current is defined. This is just a typescript issue
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        panelManager.current!.getScriptureTextPanelProps(
                            panelInfo.id,
                        );
                    if (panelProps?.editable) {
                        resourcesInUse.add(panelProps.shortName);
                    }
                });

                // Get all available resources to open (closed or editable)
                const availableResources = allResourceInfo.current.filter(
                    (resourceInfo) =>
                        !resourceInfo.editable ||
                        !resourcesInUse.has(resourceInfo.shortName),
                );

                if (availableResources.length > 0) {
                    const resource =
                        availableResources[
                            Math.floor(
                                Math.random() * availableResources.length,
                            )
                        ];
                    const rootPanel =
                        panelsInfo[
                            Math.floor(Math.random() * panelsInfo.length)
                        ];

                    panelManager.current.addPanel(
                        panelType,
                        {
                            shortName: resource.shortName,
                            editable: resource.editable,
                            ...scrRef,
                            updateScrRef,
                            useVirtualization,
                            browseBook,
                        } as ScriptureTextPanelSlateProps,
                        rootPanel
                            ? {
                                  position: {
                                      direction:
                                          DIRECTIONS[
                                              Math.floor(
                                                  Math.random() *
                                                      DIRECTIONS.length,
                                              )
                                          ],
                                      referencePanel: rootPanel.id,
                                  },
                              }
                            : undefined,
                    );
                }
            }
        },
        [browseBook, scrRef, updateScrRef, useVirtualization],
    );

    const onReady = useCallback(
        (event: DockviewReadyEvent) => {
            // Test resource info api
            getAllResourceInfo()
                .then((retrievedResourceInfo) => {
                    allResourceInfo.current = retrievedResourceInfo;
                    console.log(
                        `All Resource Info:\n${retrievedResourceInfo
                            .map(
                                (resourceInfo) =>
                                    `\tResource: ${resourceInfo.shortName}${
                                        resourceInfo.editable ? ' editable' : ''
                                    }`,
                            )
                            .join('\n')}`,
                    );

                    if (panelManager.current) {
                        // Add tabs to get up to the correct number of starting tabs
                        while (
                            panelManager.current.panelsInfo.size < startingTabs
                        )
                            addTab();
                    }

                    return undefined;
                })
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

            // Add the default tabs
            if (panelManager.current.panelsInfo.size >= startingTabs) return;

            const csbPanel = panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'CSB',
                    editable: false,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelStringProps,
            );

            if (panelManager.current.panelsInfo.size >= startingTabs) return;

            const ohebPanel = panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'OHEB',
                    editable: false,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelStringProps,
                {
                    position: {
                        direction: 'right',
                        referencePanel: csbPanel.id,
                    },
                },
            );

            if (panelManager.current.panelsInfo.size >= startingTabs) return;

            panelManager.current.addPanel(
                'ScriptureTextPanelSlate',
                {
                    shortName: 'zzz6',
                    editable: true,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelStringProps,
                {
                    position: {
                        direction: 'below',
                        referencePanel: csbPanel.id,
                    },
                },
            );

            if (panelManager.current.panelsInfo.size >= startingTabs) return;

            panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'NIV84',
                    editable: false,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelStringProps,
                {
                    position: {
                        direction: 'below',
                        referencePanel: ohebPanel.id,
                    },
                },
            );

            if (panelManager.current.panelsInfo.size >= startingTabs) return;

            const zzz1Panel = panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'zzz1',
                    editable: true,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelStringProps,
                {
                    position: {
                        direction: 'below',
                        referencePanel: ohebPanel.id,
                    },
                },
            );

            /* if (startingTabs < 6) return;

            panelManager.current.addPanel(
                'ScriptureTextPanelHtml',
                {
                    shortName: 'zzz6',
                    editable: true,
                    ...scrRef,
                    updateScrRef,
                    useVirtualization,
                    browseBook,
                } as ScriptureTextPanelStringProps,
                {
                    position: {
                        direction: 'within',
                        referencePanel: zzz1Panel.id,
                    },
                },
            ); */
        },
        [
            startingTabs,
            scrRef,
            updateScrRef,
            useVirtualization,
            browseBook,
            addTab,
        ],
    );

    return (
        <div className="layout">
            <div className="layout-bar">
                <ScrRefSelector scrRef={scrRef} handleSubmit={updateScrRef} />
                <button
                    type="button"
                    className="layout-interactive add-tab"
                    onClick={() => addTab()}
                    onContextMenu={(e: React.MouseEvent<HTMLButtonElement>) => {
                        addTab('Erb');
                        e.preventDefault();
                    }}
                >
                    Add Tab
                </button>
                <span className="settings">
                    <span className="layout-interactive">
                        Starting Tabs:
                        <input
                            type="number"
                            className="starting-tabs layout-interactive"
                            value={startingTabs}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                                updateStartingTabs(parseInt(e.target.value, 10))
                            }
                        />
                    </span>
                    <span className="layout-interactive">
                        Use Virtualization
                        <input
                            type="checkbox"
                            checked={useVirtualization}
                            onChange={(event) =>
                                updateUseVirtualization(event.target.checked)
                            }
                        />
                    </span>
                    <span className="layout-interactive">
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
                {/* <ScriptureTextPanelSlate
                    shortName="zzz6"
                    editable
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...scrRef}
                    updateScrRef={updateScrRef}
                    useVirtualization={useVirtualization}
                    browseBook={browseBook}
                /> */}
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
