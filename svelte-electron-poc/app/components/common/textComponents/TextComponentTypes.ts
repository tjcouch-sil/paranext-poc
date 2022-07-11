export enum ContentTypes {
	Unknown,
	Component,
	Element,
	Text,
}

export interface IAnnotationBase {
	/** Name of field on owner that is affected */
	ownerField: string;
}

export interface IAnnotationDefinition extends IAnnotationBase {
	/** The annotation svelte component that this definition uses */
	annotation: unknown;
	/** Determines whether this annotation should be on the content */
	annotates: (content: IContent) => boolean;
}

export interface IAnnotation extends IAnnotationBase {
	/** Type of annotation */
	type: string;
	/** Id of owning IContent */
	ownerId: string | undefined;
}

export type IAnnotations = IAnnotation[] | undefined;

export interface IContentBase {
	id?: string;
	contenteditable?: boolean;
	/** Should not be saved as this is a temporary field */
	annotations?: IAnnotations;
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
