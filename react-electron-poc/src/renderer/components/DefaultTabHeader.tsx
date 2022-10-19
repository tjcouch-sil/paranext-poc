import { DockviewDefaultTab, IDockviewPanelHeaderProps } from 'dockview';
import './Components.css';
import ptLogo from '@assets/pt-react.svg';

export default (props: IDockviewPanelHeaderProps) => {
    const { api } = props;

    const onAuxClick = () => {
        api.close();
    };

    return (
        <div className="tab-header" onAuxClick={onAuxClick}>
            <img alt="ptLogo" src={ptLogo} className="pt-logo" />
            <div className="default-wrapper">
                {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                <DockviewDefaultTab {...props} />
            </div>
        </div>
    );
};
