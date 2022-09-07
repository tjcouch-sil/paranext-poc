import './Layout.css';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import '@node_modules/dockview/dist/styles/dockview.css';
import { DockViewPanels, PanelFactory } from '@components/panels/Panels';

const Layout = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const erb = PanelFactory.buildAddPanel('Erb', undefined, {
            title: 'ERB',
        });
        const textPanel = PanelFactory.buildAddPanel(
            'TextPanel',
            { text: 'Things' },
            {
                title: 'zzz6',
                position: {
                    direction: 'right',
                    referencePanel: erb.id,
                },
            },
        );
        event.api.addPanel(erb);
        event.api.addPanel(textPanel);
    };
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
