// eslint-disable-next-line max-classes-per-file
declare module 'proskomma' {
    export class Document {}

    export class Proskomma {
        importDocument(
            selectors: object,
            contentType?: string,
            contentString?: string | Buffer,
            filterOptions?: object,
            customTags?: object,
            emptyBlocks?: object[],
            tags?: object[],
        ): Document[];
        gqlQuery(query: string): Promise<object>;
    }
    export function tree2nodes(tree: object): object;
}
