export enum ContentTypes {
	Unknown,
	Component,
	Element,
	Text,
}

export interface IContentBase {
	id?: string;
	contenteditable?: boolean;
	[prop: string]: unknown;
}

export interface IContentComponent extends IContentBase {
	type: ContentTypes.Component;
	subType: string;
	// props: [key: string]: any; - list in line for now
	contents?: IContents;
}

export interface IContentElement extends IContentBase {
	type: ContentTypes.Element;
	subType: string;
	// attributes: [key: string]: any; - list in line for now
	contents?: IContents;
}

export interface IContentText extends IContentBase {
	type: ContentTypes.Text;
	contents: string;
	// attributes: [key: string]: any; - list in line for now
}

export type IContent = IContentComponent | IContentElement | IContentText;

export type IContents = IContent[] | string | undefined;

export interface IDocument extends IContentBase {
	id?: string;
	body: IContents;
}
