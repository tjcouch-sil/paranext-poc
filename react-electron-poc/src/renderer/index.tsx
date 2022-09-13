import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container as HTMLElement);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-test:example', (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
});
window.electron.ipcRenderer.send('ipc-test:example', ['ping']);
