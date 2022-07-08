import {
	ContentTypes,
	type IContent,
	type IContents,
	type IDocument,
} from "@components/common/textComponents/TextComponentTypes";
import { writable, type Writable } from "svelte/store";

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

export function populateContentsIds(contents: IContents): IContents {
	if (contents && Array.isArray(contents)) {
		contents.forEach((content: IContent) => {
			if (content) {
				content.id = content.id || newGuid();
				populateContentsIds(content.contents);
			}
		});
	}
	return contents;
}

export function populateDocumentIds(doc: IDocument): IDocument {
	if (doc) {
		doc.id = doc.id || newGuid();
		populateContentsIds(doc.body);
	}
	return doc;
}

export function populateContentIds(content: IContent): IContent {
	if (content) {
		content.id = content.id || newGuid();
		populateContentsIds(content.contents);
	}
	return content;
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

// TODO: Fix when we use context for documents
/** The document. Any time you want to change this, run refreshDocument afterward. Otherwise use documentStore.update */
let document: IDocument;
let documentStore: Writable<IDocument>;
let refreshDocument: () => void;
let docIds: string[];
export function setDocument(doc: IDocument): Writable<IDocument> {
	document = doc;
	documentStore = writable(document);
	refreshDocument = () => documentStore.update((doc) => doc);

	// Purposely not adding the doc id right now because we don't want to delete it
	docIds = [];
	saveContentIds(doc.body);

	return documentStore;
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

export function isContentText(content: IContent | undefined): boolean {
	if (!content) {
		return false;
	}

	return content.type === ContentTypes.Text || isString(content.contents);
}

/**
 * Updates the contents of the content object with the specified id with the supplied contents
 * and refreshes the document if the contents have changed
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

	const contentIsText = isContentText(content);

	// TODO: maybe we could deep compare contents at some point, but comparing the text is fine for now
	if (!contentIsText || content.contents !== contents) {
		content.contents = contents;
		// Don't refresh the whole document if it was just a text change since contenteditable does that for us
		// TODO: improve document efficiency to prevent this from being needful
		if (!contentIsText) {
			refreshDocument();
		}
		return true;
	}

	return false;
}

/**
 * Runs an updating function on a content object and refreshes the document if it changed
 * @param id id of the content to change
 * @param updateContent function that takes the content and returns true if it changed the content
 * @returns whether the content was changed
 */
export function updateContentById(
	id: string | undefined,
	updateContent: (content: IContent) => boolean,
): boolean {
	const content = getContentById(id);
	if (!content) {
		return false;
	}

	if (updateContent(content)) {
		refreshDocument();
		return true;
	}
	return false;
}

function getContentsIds(contents: IContents): string[] {
	const ids: string[] = [];
	if (contents && Array.isArray(contents)) {
		contents.forEach((content: IContent) => {
			if (content) {
				if (content.id) {
					ids.push(content.id);
				}
				const contentIds = getContentsIds(content.contents);
				if (contentIds.length > 0) {
					contentIds.forEach((id) => ids.push(id));
				}
			}
		});
	}

	return ids;
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

				// Remove the id and child ids from the docIds
				const idsToRemove = recurse
					? getContentsIds(content.contents)
					: [];
				idsToRemove.push(id);
				idsToRemove.forEach((idToRemove) => {
					const docIdsInd = docIds.findIndex(
						(docId) => docId === idToRemove,
					);
					if (docIdsInd >= 0) {
						docIds.splice(docIdsInd, 1);
					}
				});
				refreshDocument();
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
	// TODO: Implement recurse = false in destroyContent
	if (!recurse) {
		console.warn(
			`recurse = false not implemented on destroyContentById(${id}, ${recurse}, ${readableName})`,
		);
	}
	if (id) {
		destroyContent(id, document.body, recurse);
	}
}

/**
 * Get the id of a random content - matching the filter predicate if supplied
 * @param filterPredicate funtion to filter random ids by whether the content passed into this function returns true
 * @returns id of a random content - matching the filter predicate if supplied. Undefined if there are no passing ids
 */
export function getRandomContentId(
	filterPredicate?: (content: IContent) => boolean,
): string | undefined {
	let filteredIds = docIds;
	if (filterPredicate) {
		filteredIds = filteredIds.filter((id) => {
			const content = getContentById(id);
			if (content) {
				return filterPredicate(content);
			}
			return false;
		});
	}
	return filteredIds.length > 0
		? filteredIds[Math.floor(Math.random() * filteredIds.length)]
		: undefined;
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
