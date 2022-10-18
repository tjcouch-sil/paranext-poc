import { ScriptureReference } from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { newGuid } from '@util/Util';
import {
    DockviewReadyEvent,
    AddPanelOptions,
    IDockviewPanel,
    Direction,
    IDisposable,
} from 'dockview';
import { PanelType, SCRIPTURE_PANEL_TYPES } from './Panels';
import { ScriptureTextPanelHOCProps } from './TextPanels/ScriptureTextPanelHOC';

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

/** Dockview Panel builder for our panels */
// eslint-disable-next-line import/prefer-default-export
export class PanelManager {
    /** Map of panel id to information about that panel (particularly useful for generating title) */
    panelsInfo: Map<string, PanelInfo>;

    eventListeners: IDisposable[];

    constructor(readonly dockview: DockviewReadyEvent) {
        this.panelsInfo = new Map<string, PanelInfo>();

        // Add event listeners to dockview
        this.eventListeners = [];
        this.eventListeners.push(
            dockview.api.onDidRemovePanel((panel) =>
                this.panelsInfo.delete(panel.id),
            ),
        );
    }

    dispose() {
        this.eventListeners.forEach((eventListener) => eventListener.dispose());
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
}
