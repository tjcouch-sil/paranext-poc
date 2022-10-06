// Thanks to blubberdiblub at https://stackoverflow.com/a/68141099/217579
export function newGuid(): string {
    return '00-0-4-1-000'.replace(/[^-]/g, (s) =>
        // @ts-expect-error ts(2363) this works fine
        (((Math.random() + ~~s) * 0x10000) >> s).toString(16).padStart(4, '0'),
    );
}

// thanks to DRAX at https://stackoverflow.com/a/9436948
/**
 * Determine whether the object is a string
 * @param o object to determine if it is a string
 * @returns true if the object is a string; false otherwise
 */
export function isString(o: unknown) {
    return typeof o === 'string' || o instanceof String;
}

/**
 * Evaluates if the value is truthy, false, or 0
 * @param val value to evaluate
 * @returns whether the value is truthy, false, or 0
 */
export function isValidValue(val: unknown): val is NonNullable<unknown> {
    return !!val || val === false || val === 0;
}

/** string[] of element tags that cannot have contents */
export const voidElements: string[] = [
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];
