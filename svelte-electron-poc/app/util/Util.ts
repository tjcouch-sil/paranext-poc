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

function saveContentIds(contents: IContents): void {
	if (contents && Array.isArray(contents)) {
		contents.forEach((content: IContent) => {
			if (content) {
				if (content.id) {
					docIds.push(content.id);
				}
				saveContentIds(content.contents);
			}
		});
	}
}

// TODO: Remove when we use context for documents
let document: IDocument;
let docIds: string[];
export function setDocument(doc: IDocument): IDocument {
	document = doc;

	// Purposely not adding the doc id right now because we don't want to delete it
	docIds = [];
	saveContentIds(doc.body);

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

export function updateContentById(
	id: string | undefined,
	updateContent: (content: IContent) => IContent,
): boolean {
	const content = getContentById(id);
	if (!content) {
		return false;
	}

	updateContent(content);
	return true;
}

function destroyContent(
	id: string,
	contentsToCheck: IContents,
	recurse = true,
): IContent | undefined {
	let deletedContent: IContent | undefined;
	if (contentsToCheck && Array.isArray(contentsToCheck)) {
		contentsToCheck.some((content: IContent, index: number) => {
			if (content.id === id) {
				// Delete this content
				// TODO: Implement recurse = false
				deletedContent = content;
				contentsToCheck.splice(index, 1);
				const docIdsInd = docIds.findIndex((docId) => docId === id);
				if (docIdsInd >= 0) {
					docIds.splice(docIdsInd, 1);
				}
				return true;
			}
			deletedContent = destroyContent(id, content.contents);
			if (deletedContent) {
				return true;
			}
		});
	}
	return deletedContent;
}

/**
 * Removes the content at the specified id
 * @param id id of the content to remove
 * @param recurse NOT IMPLEMENTED whether to delete the deleted content's child contents (false to put them in this content's place). Defaults to true
 * @param readableName name to print in console for the deleted content
 */
export function destroyContentById(
	id: string | undefined,
	recurse = true,
	readableName?: string,
) {
	console.log(`Destroy: ${readableName ? `${readableName}: ` : ""}${id}`);
	// TODO: Implement recurse = false
	if (!recurse) {
		console.warn(
			`recurse = false not implemented on destroyContentById(${id}, ${recurse}, ${readableName})`,
		);
	}
	if (id) {
		destroyContent(id, document.body, recurse);
	}
}

export function getRandomContentId(): string {
	return docIds[Math.floor(Math.random() * docIds.length)];
}

export function destroyContentAtRandom() {
	const idToDestroy = getRandomContentId();
	destroyContentById(idToDestroy);
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
