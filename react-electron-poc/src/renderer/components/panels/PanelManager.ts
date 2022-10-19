import { ScriptureReference } from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { newGuid } from '@util/Util';
import { DockviewReadyEvent, AddPanelOptions } from 'dockview';
import { PanelType } from './Panels';
import { ScriptureTextPanelHOCProps } from './TextPanels/ScriptureTextPanelHOC';

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

    constructor(readonly dockview: DockviewReadyEvent) {
        this.panelsInfo = new Map<string, PanelInfo>();
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
            return `${scrPanelProps.shortName}: ${getTextFromScrRef({
                book: scrPanelProps.book,
                chapter: scrPanelProps.chapter,
                verse: -1,
            })}${scrPanelProps.editable ? ' Editable' : ''}${
                panelInfo.type === 'ScriptureTextPanelSlate' ? ' Slate' : ''
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
        panelType: PanelType,
        panelProps: object = {},
        addPanelOptions: Omit<
            AddPanelOptions,
            'id' | 'component' | 'params'
        > = {},
    ) {
        const [panelInfo, panelOptions] = PanelManager.buildPanel(
            panelType,
            panelProps,
            addPanelOptions,
        );
        this.panelsInfo.set(panelInfo.id, panelInfo);
        return this.dockview.api.addPanel(panelOptions);
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
