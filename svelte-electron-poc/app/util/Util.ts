import {
	ContentTypes,
	type IContent,
	type IContents,
	type IDocument,
} from "@components/common/textComponents/TextComponentTypes";

// Thanks to blubberdiblub at https://stackoverflow.com/a/68141099/217579
export function newGuid(): string {
	return "00-0-4-1-000".replace(/[^-]/g, (s) =>
		// @ts-expect-error ts(2363) this works fine
		(((Math.random() + ~~s) * 0x10000) >> s).toString(16).padStart(4, "0"),
	);
}

// thanks to DRAX at https://stackoverflow.com/a/9436948
/**
 * Determine whether the object is a string
 * @param o object to determine if it is a string
 * @returns true if the object is a string; false otherwise
 */
export function isString(o: unknown) {
	return typeof o === "string" || o instanceof String;
}

/**
 * Evaluates if the value is truthy, false, or 0
 * @param val value to evaluate
 * @returns whether the value is truthy, false, or 0
 */
export function isValidValue(val: unknown): boolean {
	return !!val || val === false || val === 0;
}

function populateContentIds(contents: IContents): void {
	if (contents && Array.isArray(contents)) {
		contents.forEach((content: IContent) => {
			if (content) {
				content.id = content.id || newGuid();
				populateContentIds(content.contents);
			}
		});
	}
}

export function populateIds(doc: IDocument): IDocument {
	if (doc) {
		doc.id = doc.id || newGuid();
		populateContentIds(doc.body);
	}
	return doc;
}

// TODO: Remove when we use context for documents
let document: IDocument;
export function setDocument(doc: IDocument): IDocument {
	document = doc;
	return doc;
}

function getContentFromContentsById(
	id: string,
	contents: IContents,
): IContent | undefined {
	let matchingContent: IContent | undefined;
	if (contents && Array.isArray(contents)) {
		contents.some((content: IContent) => {
			if (content.id === id) {
				matchingContent = content;
				return true;
			}
			matchingContent = getContentFromContentsById(id, content.contents);
			if (matchingContent) {
				return true;
			}
		});
	}
	return matchingContent;
}

export function getContentById(id: string | undefined): IContent | undefined {
	if (!document || !isValidValue(id)) {
		return;
	}

	return getContentFromContentsById(id as string, document.body);
}

/**
 * Updates the contents of the current document with the supplied contents at the specified id if the contents have changed
 * @param id id of the content whose contents to update
 * @param contents new contents for updating
 * @returns true if there was a change; false otherwise
 */
export function updateContentsById(
	id: string | undefined,
	contents: IContents,
): boolean {
	const content = getContentById(id);
	if (!content) {
		return false;
	}

	if (content.type !== ContentTypes.Text || content.contents !== contents) {
		content.contents = contents;
		return true;
	}

	return false;
}

/** string[] of element tags that cannot have contents */
export const voidElements: string[] = [
	"area",
	"base",
	"br",
	"col",
	"command",
	"embed",
	"hr",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
];
