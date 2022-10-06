export const getSetting = <T>(key: string): T | undefined => {
    const setting = localStorage.getItem(key);
    return setting ? JSON.parse(setting) : setting;
};

export const setSetting = <T>(key: string, value: T | undefined) => {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
};
