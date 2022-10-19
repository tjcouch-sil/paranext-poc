import './Erb.css';
import iconFrame from '@assets/icon-frame.svg';
import ptLogo from '@assets/pt-react.svg';

export interface ErbProps {
    display: string;
}

export const Erb = ({ display = 'electron-react-boilerplate' }: ErbProps) => {
    return (
        <div className="erb-wrapper">
            <div className="content-wrapper">
                <div className="Hello">
                    <div className="images">
                        <img
                            width="250"
                            alt="iconFrame"
                            src={iconFrame}
                            className="icon-frame"
                        />
                        <img
                            width="140"
                            alt="ptLogo"
                            src={ptLogo}
                            className="pt-logo spin"
                        />
                    </div>
                </div>
                <svg className="erb-title pulse" viewBox="0 0 194 21">
                    <text x="0" y="15" fontWeight="Bold" fill="white">
                        Paranext Web POC 2: React
                    </text>
                </svg>
                <svg className="erb-title" viewBox="0 0 176 21">
                    <text x="0" y="15" fontWeight="Bold" fill="white">
                        {display}
                    </text>
                </svg>
                {/* <div className="Hello">
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
                </div> */}
            </div>
        </div>
    );
};
