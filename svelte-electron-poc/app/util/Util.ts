import type {
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

function populateContentIds(contents: IContents) {
	if (contents && Array.isArray(contents)) {
		// Can remove if we figure out typescript
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		contents?.forEach((content: any /* IContent */) => {
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

// thanks to DRAX at https://stackoverflow.com/a/9436948
export function isString(o: object) {
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
