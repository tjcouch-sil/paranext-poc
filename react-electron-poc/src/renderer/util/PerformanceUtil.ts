import { StartTime } from '@shared/data/PerformanceTypes';

function startTimeToString(startTime: StartTime): string {
    return `Process start: ${startTime.process}, Code entry: ${startTime.entry}`;
}

export default { startTimeToString };
