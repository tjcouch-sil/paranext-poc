const getFullKey = (key: string): string => `$settings-${key}`;

export const getSetting = <T>(key: string): T | null | undefined => {
    const setting = localStorage.getItem(getFullKey(key));
    if (setting === null) return null;
    return JSON.parse(setting);
};

export const setSetting = <T>(key: string, value: T | null | undefined) => {
    if (value === null || value === undefined)
        localStorage.removeItem(getFullKey(key));
    else localStorage.setItem(getFullKey(key), JSON.stringify(value));
};
