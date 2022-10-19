import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels } from '@components/panels/Panels';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    getAllResourceInfo,
    getResourceInfo,
} from '@services/ScriptureService';
import { ResourceInfo, ScriptureReference } from '@shared/data/ScriptureTypes';
import ScrRefSelector from '@components/ScrRefSelector';
import {
    AddPanelType,
    ADD_SCRIPTURE_PANEL_TYPES,
    DIRECTIONS,
    PanelManager,
    PANEL_TYPE_RANDOM_SCRIPTURE,
} from '@components/panels/PanelManager';
import { getSetting, setSetting } from '@services/SettingsService';
import {
    offsetChapter,
    offsetVerse,
    startChangeScrRef,
} from '@util/ScriptureUtil';
import isHotkey from 'is-hotkey';
import { ScriptureTextPanelSlateProps } from '@components/panels/TextPanels/ScriptureTextPanelSlate';
import { isValidValue } from '@util/Util';
import DefaultTabHeader from '@components/DefaultTabHeader';

/** Key for saving scrRef setting */
const scrRefSettingKey = 'scrRef';
/** Key for saving browseBook setting */
const useVirtualizationSettingKey = 'useVirtualization';
/** Key for saving browseBook setting */
const browseBookSettingKey = 'browseBook';
/** Key for saving startingTabs setting */
const startingTabsSettingKey = 'startingTabs';
/** Key for saving newTabType setting */
const newTabTypeSettingKey = 'newTabType';

const isHotkeyPreviousChapter = isHotkey('mod+alt+ArrowUp');
const isHotkeyNextChapter = isHotkey('mod+alt+ArrowDown');
const isHotkeyPreviousVerse = isHotkey('mod+alt+ArrowLeft');
const isHotkeyNextVerse = isHotkey('mod+alt+ArrowRight');

const Layout = () => {
    const panelManager = useRef<PanelManager | undefined>(undefined);

    // The Scripture reference the panels are synced on
    const [scrRef, setScrRef] = useState<ScriptureReference>(
        getSetting<ScriptureReference>(scrRefSettingKey) || {
            book: 19,
            chapter: 119,
            verse: 1,
        },
    );
    const updateScrRef = useCallback((newScrRef: ScriptureReference) => {
        startChangeScrRef.lastChangeTime = performance.now();
        setScrRef(newScrRef);
        setSetting(scrRefSettingKey, newScrRef);

        panelManager.current?.updateScrRef(newScrRef);
    }, []);

    // Whether the Slate panels use virtualization to render what is visible on screen
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

    // Whether the panels load full books or just a chapter
    const [browseBook, setBrowseBook] = useState<boolean>(
        getSetting<boolean>(browseBookSettingKey) || false,
    );
    const updateBrowseBook = useCallback((newBrowseBook: boolean) => {
        setBrowseBook(newBrowseBook);
        setSetting(browseBookSettingKey, newBrowseBook);

        panelManager.current?.updateBrowseBook(newBrowseBook);
    }, []);

    // How many tabs to open on startup
    const [startingTabs, setStartingTabs] = useState<number>(() => {
        const startingTabsSaved = getSetting<number>(startingTabsSettingKey);
        if (isValidValue(startingTabsSaved)) return startingTabsSaved;
        return 5;
    });
    const updateStartingTabs = useCallback((newStartingTabs: number) => {
        setStartingTabs(Math.max(0, Math.min(newStartingTabs, 99)));
        setSetting(startingTabsSettingKey, newStartingTabs);
    }, []);

    // Selected tab type to open on startup or when clicking Add Tab
    const [newTabType, setNewTabType] = useState<AddPanelType>(
        getSetting<AddPanelType>(newTabTypeSettingKey) ||
            PANEL_TYPE_RANDOM_SCRIPTURE,
    );
    const updateNewTabType = useCallback((newNewTabType: AddPanelType) => {
        setNewTabType(newNewTabType);
        setSetting(newTabTypeSettingKey, newNewTabType);
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
        (panelType: AddPanelType = newTabType) => {
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
        [newTabType, browseBook, scrRef, updateScrRef, useVirtualization],
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

            if (panelManager.current) panelManager.current.dispose();
            panelManager.current = new PanelManager(event);

            /* // Add the default tabs
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
            );
            */
        },
        [startingTabs, addTab],
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
                    Add
                    <select
                        className="layout-interactive embedded-input tab-type-select"
                        onClick={(e: React.MouseEvent<HTMLSelectElement>) => {
                            // Do not add a tab when we click the dropdown
                            e.stopPropagation();
                        }}
                        value={newTabType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateNewTabType(e.target.value as AddPanelType)
                        }
                    >
                        {ADD_SCRIPTURE_PANEL_TYPES.map((addPanelType) => (
                            <option value={addPanelType}>
                                {addPanelType.replace('ScriptureTextPanel', '')}
                            </option>
                        ))}
                    </select>
                    Tab
                </button>
                <span className="settings">
                    <label className="layout-interactive">
                        Starting Tabs:
                        <input
                            type="number"
                            className="layout-interactive embedded-input"
                            value={startingTabs}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                                updateStartingTabs(parseInt(e.target.value, 10))
                            }
                        />
                    </label>
                    <label className="layout-interactive">
                        Use Virtualization
                        <input
                            type="checkbox"
                            checked={useVirtualization}
                            onChange={(event) =>
                                updateUseVirtualization(event.target.checked)
                            }
                        />
                    </label>
                    <label className="layout-interactive">
                        Edit whole book
                        <input
                            type="checkbox"
                            checked={browseBook}
                            onChange={(event) =>
                                updateBrowseBook(event.target.checked)
                            }
                        />
                    </label>
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
                    defaultTabComponent={DefaultTabHeader}
                />
            </div>
        </div>
    );
};
export default Layout;
