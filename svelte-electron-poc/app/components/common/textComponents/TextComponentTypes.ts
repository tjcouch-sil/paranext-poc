export enum ContentTypes {
	Component,
	Element,
	Text,
}

export interface IContentBase {
	id?: string;
}

export interface IContentComponent extends IContentBase {
	type: "component";
	subType: string;
	// props: [key: string]: any; - list in line for now
	contents: IContents;
}

export interface IContentElement extends IContentBase {
	type: "element";
	subType: string;
	// attributes: [key: string]: any; - list in line for now
	contents: IContents;
}

export interface IContentText extends IContentBase {
	type: "text";
	contents: string;
	// attributes: [key: string]: any; - list in line for now
}

export type IContent = IContentComponent | IContentElement | IContentText;

export interface IContents {
	contents: IContent[] | string;
}

export interface IDocument {
	id: string;
	body: IContents;
}
