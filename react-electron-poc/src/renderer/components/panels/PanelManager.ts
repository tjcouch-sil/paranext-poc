import { ScriptureReference } from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { newGuid } from '@util/Util';
import {
    DockviewReadyEvent,
    AddPanelOptions,
    IDockviewPanel,
    Direction,
    IDisposable,
    SerializedDockview,
} from 'dockview';
import { PanelType, SCRIPTURE_PANEL_TYPES } from './Panels';
import {
    ScriptureTextPanelFunctions,
    ScriptureTextPanelHOCProps,
} from './TextPanels/ScriptureTextPanelHOC';

export const DIRECTIONS: Direction[] = [
    'left',
    'right',
    'above',
    'below',
    'within',
];

export const PANEL_TYPE_RANDOM_SCRIPTURE = 'ScriptureTextPanelRandom';
export type AddPanelType = PanelType | typeof PANEL_TYPE_RANDOM_SCRIPTURE;
export const ADD_SCRIPTURE_PANEL_TYPES: AddPanelType[] = [
    PANEL_TYPE_RANDOM_SCRIPTURE,
    ...SCRIPTURE_PANEL_TYPES,
];

export interface PanelInfo {
    id: string;
    type: PanelType;
    /** The title for the panel. Set if provided, undefined if generated */
    title?: string;
}

export interface SerializedPanelManager {
    panelsInfo: PanelInfo[];
    dockview: SerializedDockview;
}

/** How long in ms to wait after a panel is removed to delete its panelInfo */
const REMOVE_PANEL_TIMEOUT = 10;

/** Dockview Panel builder for our panels */
// eslint-disable-next-line import/prefer-default-export
export class PanelManager {
    /** Map of panel id to information about that panel (particularly useful for generating title) */
    panelsInfo: Map<string, PanelInfo>;

    /**
     * Map of panel id for potentially removed panels to the timeout to delete them.
     * Needed because moving a panel deletes it and re-adds it, and we want to keep panelInfo around for moved panels
     */
    removedPanelTimeouts: Map<string, NodeJS.Timeout>;

    eventListeners: IDisposable[];

    constructor(readonly dockview: DockviewReadyEvent) {
        this.panelsInfo = new Map<string, PanelInfo>();
        this.removedPanelTimeouts = new Map<string, NodeJS.Timeout>();

        // Add event listeners to dockview
        this.eventListeners = [];
        this.eventListeners.push(
            dockview.api.onDidRemovePanel((panel) => {
                const existingTimeout = this.removedPanelTimeouts.get(panel.id);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    console.error(
                        'PanelManager.removedPanelTimeouts already has a remove timeout for this panel! Clearing and setting a new timeout.',
                    );
                }
                // When a panel is removed, mark it to be deleted but wait before deleting it. The panel may have been moved and will be readded in a moment
                this.removedPanelTimeouts.set(
                    panel.id,
                    setTimeout(() => {
                        this.panelsInfo.delete(panel.id);
                        this.removedPanelTimeouts.delete(panel.id);
                        console.log(`PanelInfo removed for ${panel.id}`);
                    }, REMOVE_PANEL_TIMEOUT),
                );
            }),
        );
        this.eventListeners.push(
            dockview.api.onDidAddPanel((panel) => {
                // If there was a timeout to remove this panels' info, this panel was likely moved.
                // Clear the timeout so we don't remove its panelInfo
                const existingTimeout = this.removedPanelTimeouts.get(panel.id);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    this.removedPanelTimeouts.delete(panel.id);
                    console.log(`Timeout removed for ${panel.id}`);
                }
            }),
        );
    }

    dispose() {
        this.eventListeners.forEach((eventListener) => eventListener.dispose());
        this.removedPanelTimeouts.forEach((timeout) => clearTimeout(timeout));
    }

    static generatePanelTitle(
        panelInfo: PanelInfo | undefined,
        panelProps: object = {},
    ): string {
        if (!panelInfo)
            throw new Error('generatePanelTitle: panelInfo undefined!');
        if (panelInfo.title || panelInfo.title === '') return panelInfo.title;

        if (panelInfo.type.startsWith('ScriptureTextPanel')) {
            const scrPanelProps = panelProps as ScriptureTextPanelHOCProps;
            return `${scrPanelProps.editable ? '[' : ''}${
                scrPanelProps.shortName
            }: ${getTextFromScrRef({
                book: scrPanelProps.book,
                chapter: scrPanelProps.chapter,
                verse: -1,
            })} ${panelInfo.type.replace('ScriptureTextPanel', '')}${
                scrPanelProps.editable ? ']' : ''
            }`;
        }
        return panelInfo.type;
    }

    /** Returns AddPanelOptions for the specified input */
    static buildPanel(
        panelType: PanelType,
        panelProps: object = {},
        addPanelOptions: Omit<
            AddPanelOptions,
            'id' | 'component' | 'params'
        > = {},
    ): [PanelInfo, AddPanelOptions] {
        const panelInfo = {
            id: newGuid(),
            type: panelType,
            title: addPanelOptions.title,
        };
        return [
            panelInfo,
            {
                ...addPanelOptions,
                id: panelInfo.id,
                component: panelType,
                params: { ...panelProps },
                title: PanelManager.generatePanelTitle(panelInfo, panelProps),
            },
        ];
    }

    /** Creates a new panel and adds it to the view */
    addPanel(
        panelType: AddPanelType,
        panelProps: object = {},
        addPanelOptions: Omit<
            AddPanelOptions,
            'id' | 'component' | 'params'
        > = {},
    ) {
        const addPanelType =
            panelType === PANEL_TYPE_RANDOM_SCRIPTURE
                ? SCRIPTURE_PANEL_TYPES[
                      Math.floor(Math.random() * SCRIPTURE_PANEL_TYPES.length)
                  ]
                : panelType;
        const [panelInfo, panelOptions] = PanelManager.buildPanel(
            addPanelType,
            panelProps,
            addPanelOptions,
        );
        this.panelsInfo.set(panelInfo.id, panelInfo);
        return this.dockview.api.addPanel(panelOptions);
    }

    getPanel(id: string): IDockviewPanel | undefined {
        return this.dockview.api.panels.find((panel) => panel.id === id);
    }

    getScriptureTextPanelProps(
        id: string,
    ): ScriptureTextPanelHOCProps | undefined {
        if (this.panelsInfo.get(id)?.type.startsWith('ScriptureTextPanel'))
            return this.getPanel(id)?.params as ScriptureTextPanelHOCProps;
        return undefined;
    }

    updateScrRef(newScrRef: ScriptureReference): void {
        this.dockview.api.panels.forEach((panel) => {
            const panelPropsUpdated = {
                ...panel.params,
                ...newScrRef,
            };
            panel.update({
                params: {
                    params: panelPropsUpdated,
                    title: PanelManager.generatePanelTitle(
                        this.panelsInfo.get(panel.id),
                        panelPropsUpdated,
                    ),
                },
            });
        });
    }

    updateUseVirtualization(newUseVirtualization: boolean): void {
        this.dockview.api.panels.forEach((panel) => {
            const panelPropsUpdated = {
                ...panel.params,
                useVirtualization: newUseVirtualization,
            };
            panel.update({
                params: {
                    params: panelPropsUpdated,
                    title: PanelManager.generatePanelTitle(
                        this.panelsInfo.get(panel.id),
                        panelPropsUpdated,
                    ),
                },
            });
        });
    }

    updateBrowseBook(newBrowseBook: boolean): void {
        this.dockview.api.panels.forEach((panel) => {
            const panelPropsUpdated = {
                ...panel.params,
                browseBook: newBrowseBook,
            };
            panel.update({
                params: {
                    params: panelPropsUpdated,
                    title: PanelManager.generatePanelTitle(
                        this.panelsInfo.get(panel.id),
                        panelPropsUpdated,
                    ),
                },
            });
        });
    }

    updatePanelFunctions(panelFunctions: ScriptureTextPanelFunctions): void {
        this.dockview.api.panels.forEach((panel) => {
            const panelPropsUpdated = {
                ...panel.params,
                ...panelFunctions,
            };
            panel.update({
                params: {
                    params: panelPropsUpdated,
                    title: PanelManager.generatePanelTitle(
                        this.panelsInfo.get(panel.id),
                        panelPropsUpdated,
                    ),
                },
            });
        });
    }

    /**
     * Serialize this PanelManager's state to an object.
     * NOTE: This does not actually use a JSON string but an object. This is named to match the dockview api.
     * WARNING: This does not serialize functions from the object. You must provide those when deserializing.
     */
    toJSON(): SerializedPanelManager {
        return {
            // All the panels that aren't removed or being considered for removal so we don't get any recently closed panels.
            // This will also unfortunately miss all the recently moved panels, but that's probably less likely than recently closed.
            panelsInfo: Array.from(this.panelsInfo.values()).filter(
                (panelInfo) => !this.removedPanelTimeouts.has(panelInfo.id),
            ),
            dockview: this.dockview.api.toJSON(),
        };
    }

    /**
     * Deserialize this PanelManager's state from an object.
     * NOTE: This does not actually use a JSON string but an object. This is named to match the dockview api.
     * WARNING: This does not deserialize functions from the object. You must provide those with panelFunctions.
     * @param serializedPanelManager the PanelManager state
     * @param panelFunctions the functions to insert into the params (props) for each panel because we cannot serialize functions
     * @throws error if there are already panels added because that's not really in scope right now.
     */
    fromJSON(
        serializedPanelManager: SerializedPanelManager,
        panelFunctions: ScriptureTextPanelFunctions,
    ): void {
        if (this.panelsInfo.size > 0)
            throw new Error(
                'Cannot deserialize from a PanelManager that already has panels!',
            );

        serializedPanelManager.panelsInfo.forEach((panelInfo) =>
            this.panelsInfo.set(panelInfo.id, panelInfo),
        );
        this.dockview.api.fromJSON(serializedPanelManager.dockview);
        this.updatePanelFunctions(panelFunctions);
    }
}
