import type {
	IContent,
	IContents,
	IDocument,
} from "@components/common/textComponents/TextComponentTypes";

// Thanks to blubberdiblub at https://stackoverflow.com/a/68141099/217579
export function newGuid(): string {
	return "00-0-4-1-000".replace(/[^-]/g, (s) =>
		// @ts-expect-error ts(2363) this works fine
		(((Math.random() + ~~s) * 0x10000) >> s).toString(16).padStart(4, "0"),
	);
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
	id: string | undefined,
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
	if (!document) {
		return;
	}

	return getContentFromContentsById(id, document.body);
}

// thanks to DRAX at https://stackoverflow.com/a/9436948
export function isString(o: unknown) {
	return typeof o === "string" || o instanceof String;
}

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
