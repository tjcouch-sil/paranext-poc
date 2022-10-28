/** Information about the timings of the application */
export interface StartTime {
    /**
     * The time at which the process started in milliseconds from Unix time.
     * In JS environments, this is performance.timeOrigin
     */
    process: number;
    /**
     * The time at which the application's main code received control in milliseconds from Unix time.
     * In JS environments, this is Date.now() at the code entry point.
     */
    entry: number;
}
