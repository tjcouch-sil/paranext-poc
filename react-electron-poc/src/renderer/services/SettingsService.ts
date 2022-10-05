const getFullKey = (key: string): string => `$settings-${key}`;

export const getSetting = <T>(key: string): T | undefined => {
    const setting = localStorage.getItem(getFullKey(key));
    return setting ? JSON.parse(setting) : setting;
};

export const setSetting = <T>(key: string, value: T | undefined) => {
    if (value) localStorage.setItem(getFullKey(key), JSON.stringify(value));
    else localStorage.removeItem(getFullKey(key));
};
