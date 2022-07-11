import type { IAnnotationDefinition } from "../TextComponentTypes";
import { VerseApprovedCheckbox } from "./Checkbox/Checkbox";
import { ExclamationHighlight } from "./Highlight/Highlight";

export const AnnotationDefinitions: { [key: string]: IAnnotationDefinition } = {
	VerseApprovedCheckbox,
	ExclamationHighlight,
};
