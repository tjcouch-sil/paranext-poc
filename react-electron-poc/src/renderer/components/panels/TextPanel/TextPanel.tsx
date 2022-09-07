import '@assets/testScripture/zzz6.css';
import './TextPanel.css';

export interface TextPanelProps {
    text: string;
}

export const TextPanel = ({
    text = 'Hi! This is a text panel!',
}: TextPanelProps) => {
    return (
        <div
            className="text-panel"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
};
export default TextPanel;
