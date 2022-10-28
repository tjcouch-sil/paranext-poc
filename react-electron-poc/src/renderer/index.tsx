import { StartTime } from '@shared/data/PerformanceTypes';
import { createRoot } from 'react-dom/client';
import App from './App';

// eslint-disable-next-line import/prefer-default-export
export const rendererStartTime: StartTime = {
    process: performance.timeOrigin,
    entry: Date.now(),
};

const container = document.getElementById('root');
const root = createRoot(container as HTMLElement);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-test:example', (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
});
window.electron.ipcRenderer.send('ipc-test:example', ['ping']);
