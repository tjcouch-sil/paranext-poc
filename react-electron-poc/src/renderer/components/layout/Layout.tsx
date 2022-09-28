import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels } from '@components/panels/Panels';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { getScripture, getScriptureHtml, getResourceInfo,
getAllResourceInfo, } from '@services/ScriptureService';
import { ResourceInfo, ScriptureReference } from '@shared/data/ScriptureTypes';
import ScrRefSelector from '@components/ScrRefSelector';
import {
    AddPanelType,
    ADD_SCRIPTURE_PANEL_TYPES,
    DIRECTIONS,
    PanelManager,
    PANEL_TYPE_RANDOM_SCRIPTURE,
    SerializedPanelManager,
} from '@components/panels/PanelManager';
import { getSetting, setSetting } from '@services/SettingsService';
import { offsetChapter, offsetVerse } from '@util/ScriptureUtil';
import isHotkey from 'is-hotkey';
import { ScriptureTextPanelSlateProps } from '@components/panels/TextPanels/ScriptureTextPanelSlate';
import { isValidValue } from '@util/Util';
import DefaultTabHeader from '@components/DefaultTabHeader';
import { ScriptureTextPanelFunctions } from '@components/panels/TextPanels/ScriptureTextPanelHOC';
import { startChangeScrRef } from '@services/PerformanceService';

/** Key for saving scrRef setting */
const scrRefSettingKey = 'scrRef';
/** Key for saving browseBook setting */
const useVirtualizationSettingKey = 'useVirtualization';
/** Key for saving browseBook setting */
const browseBookSettingKey = 'browseBook';
/** Key for saving startingTabs setting */
const startingTabsSettingKey = 'startingTabs';
/** Key for saving newTabShortName setting */
const newTabShortNameSettingKey = 'newTabShortName';
/** Key for saving newTabType setting */
const newTabTypeSettingKey = 'newTabType';
/** Key for saving rememberLayout */
const rememberLayoutSettingKey = 'rememberLayout';
/** Key for saving savedLayout */
const savedLayoutSettingKey = 'savedLayout';

/** Key for picking a random shortName for opening a new Scripture panel */
const SHORT_NAME_RANDOM = 'Random';

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

    // Selected tab shortName to open on startup or when clicking Add Tab
    const [newTabShortName, setNewTabShortName] = useState<string>(
        getSetting<string>(newTabShortNameSettingKey) || SHORT_NAME_RANDOM,
    );
    const updateNewTabShortName = useCallback((newNewTabShortName: string) => {
        setNewTabShortName(newNewTabShortName);
        setSetting(newTabShortNameSettingKey, newNewTabShortName);
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

    // Whether the panels from the previous session are restored on startup
    const [rememberLayout, setRememberLayout] = useState<boolean>(() => {
        const rememberLayoutSaved = getSetting<boolean>(
            rememberLayoutSettingKey,
        );
        if (isValidValue(rememberLayoutSaved)) return rememberLayoutSaved;
        return true;
    });
    const updateRememberLayout = useCallback(
        (newRememberLayout: boolean) => {
            setRememberLayout(newRememberLayout);
            setSetting(rememberLayoutSettingKey, newRememberLayout);
            if (!newRememberLayout && panelManager.current) {
                // Starting Tabs is now available again. Set to current number of open panels
                updateStartingTabs(panelManager.current.panelsInfo.size);
            }
        },
        [updateStartingTabs],
    );

    /** Whether the layout has been loaded yet */
    const layoutLoaded = useRef<boolean>(false);

    /** Functions that are props for panels */
    const panelFunctions = useMemo<ScriptureTextPanelFunctions>(
        () => ({ updateScrRef }),
        [updateScrRef],
    );

    // All Resource Information on available resources
    const [allResourceInfo, setAllResourceInfo] = useState<ResourceInfo[]>([]);

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
        (
            panelType: AddPanelType = newTabType,
            shortName = newTabShortName,
            availableResourceInfo = allResourceInfo,
        ) => {
            if (panelManager.current) {
                const panelsInfo = Array.from(
                    panelManager.current.panelsInfo.values(),
                );

                let resource: ResourceInfo | undefined;

                // Get the selected resource if specified and available
                if (shortName !== SHORT_NAME_RANDOM) {
                    resource = availableResourceInfo.find(
                        (resourceInfo) => resourceInfo.shortName === shortName,
                    );
                }

                // If we didn't find a specified resource, get a random one
                if (!resource) {
                    // Get all resources that are open and are editable (don't want two of the same resource open for now)
                    const resourcesInUse: Set<string> = new Set<string>();

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
                    const availableResources = availableResourceInfo.filter(
                        (resourceInfo) =>
                            !resourceInfo.editable ||
                            !resourcesInUse.has(resourceInfo.shortName),
                    );

                    if (availableResources.length > 0)
                        resource =
                            availableResources[
                                Math.floor(
                                    Math.random() * availableResources.length,
                                )
                            ];
                }

                // If we decided on a resource, open it
                if (resource) {
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
                            useVirtualization,
                            browseBook,
                            ...panelFunctions,
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
        [
            newTabType,
            newTabShortName,
            allResourceInfo,
            browseBook,
            scrRef,
            useVirtualization,
            panelFunctions,
        ],
    );

    const onReady = useCallback(
        (event: DockviewReadyEvent) => {
            // Test resource info api
            getAllResourceInfo()
                .then((retrievedResourceInfo) => {
                    setAllResourceInfo(retrievedResourceInfo);
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

                    // If new tab shortName is not in the available resources, reset to Random
                    if (
                        newTabShortName !== SHORT_NAME_RANDOM &&
                        !retrievedResourceInfo.some(
                            (resourceInfo) =>
                                resourceInfo.shortName === newTabShortName,
                        )
                    )
                        updateNewTabShortName(SHORT_NAME_RANDOM);

                    // Load tabs
                    if (panelManager.current) {
                        if (rememberLayout) {
                            // Load up the saved layout
                            const savedLayout =
                                getSetting<SerializedPanelManager>(
                                    savedLayoutSettingKey,
                                );
                            if (savedLayout)
                                panelManager.current.fromJSON(
                                    savedLayout,
                                    panelFunctions,
                                );
                        } else {
                            // Add tabs to get up to the correct number of starting tabs
                            while (
                                panelManager.current.panelsInfo.size <
                                startingTabs
                            )
                                addTab(
                                    undefined,
                                    undefined,
                                    retrievedResourceInfo,
                                );
                        }

                        layoutLoaded.current = true;
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
        },
        [
            newTabShortName,
            updateNewTabShortName,
            rememberLayout,
            startingTabs,
            panelFunctions,
            addTab,
        ],
    );

    // Register an event listener to save the layout before closing
    useEffect(() => {
        if (!rememberLayout) return () => {};

        const saveLayout = () => {
            if (layoutLoaded.current && panelManager.current) {
                // Save layout before closing if it has loaded up
                setSetting<SerializedPanelManager>(
                    savedLayoutSettingKey,
                    // Need to make a toJSON in panelManager so it saves panelInfo
                    panelManager.current.toJSON(),
                );
            }
        };

        window.addEventListener('beforeunload', saveLayout);

        return () => {
            window.removeEventListener('beforeunload', saveLayout);
        };
    }, [rememberLayout]);

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
                        className="layout-interactive embedded-input tab-select"
                        onClick={(e: React.MouseEvent<HTMLSelectElement>) => {
                            // Do not add a tab when we click the dropdown
                            e.stopPropagation();
                        }}
                        value={newTabShortName}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateNewTabShortName(e.target.value)
                        }
                    >
                        {[
                            SHORT_NAME_RANDOM,
                            ...allResourceInfo.map(
                                (resourceInfo) => resourceInfo.shortName,
                            ),
                        ].map((addPanelShortName) => (
                            <option
                                key={addPanelShortName}
                                value={addPanelShortName}
                            >
                                {addPanelShortName}
                            </option>
                        ))}
                    </select>
                    <select
                        className="layout-interactive embedded-input tab-select"
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
                            <option key={addPanelType} value={addPanelType}>
                                {addPanelType.replace('ScriptureTextPanel', '')}
                            </option>
                        ))}
                    </select>
                    Tab
                </button>
                <span className="settings">
                    {!rememberLayout && (
                        <label className="layout-interactive">
                            Starting Tabs:
                            <input
                                type="number"
                                className="layout-interactive embedded-input"
                                value={startingTabs}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    updateStartingTabs(
                                        parseInt(e.target.value, 10),
                                    )
                                }
                            />
                        </label>
                    )}
                    <label className="layout-interactive">
                        Remember Layout
                        <input
                            type="checkbox"
                            checked={rememberLayout}
                            onChange={(event) =>
                                updateRememberLayout(event.target.checked)
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
