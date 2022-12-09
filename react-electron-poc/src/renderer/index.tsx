import { createRoot } from 'react-dom/client';
import * as PerformanceService from '@services/PerformanceService';
import * as WebSocketService from '@services/WebSocketService';
import App from './App';

// App-wide service setup
PerformanceService.performanceLog({
    name: 'index.tsx',
    operation: 'entered index code',
    end: performance.now(),
    reportStart: true,
});
PerformanceService.initialize();
WebSocketService.connect();

const container = document.getElementById('root');
const root = createRoot(container as HTMLElement);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-test:example', (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
});
window.electron.ipcRenderer.send('ipc-test:example', ['ping']);
