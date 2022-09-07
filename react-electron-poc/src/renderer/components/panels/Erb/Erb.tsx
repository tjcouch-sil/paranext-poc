import './Erb.css';
import icon from '@assets/icon.svg';

export interface ErbProps {
    display: string;
}

export const Erb = ({ display = 'electron-react-boilerplate' }: ErbProps) => {
    return (
        <div className="wrapper">
            <div>
                <div className="Hello">
                    <img width="200" alt="icon" src={icon} />
                </div>
                <svg className="erb-title" viewBox="0 0 192 20">
                    <text x="0" y="15" fontWeight="Bold" fill="white">
                        {display}
                    </text>
                </svg>
                <div className="Hello">
                    <a
                        href="https://electron-react-boilerplate.js.org/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <button type="button">
                            <span role="img" aria-label="books">
                                📚
                            </span>
                            Read our docs
                        </button>
                    </a>
                    <a
                        href="https://github.com/sponsors/electron-react-boilerplate"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <button type="button">
                            <span role="img" aria-label="books">
                                🙏
                            </span>
                            Donate
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};
export default Erb;
