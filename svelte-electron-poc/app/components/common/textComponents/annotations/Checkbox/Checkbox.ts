import type { IAnnotationDefinition } from "../../TextComponentTypes";
import Checkbox from "./Checkbox.svelte";

export const VerseApprovedCheckbox: IAnnotationDefinition = {
	component: Checkbox,
	annotates: (content) => {
		return content.verseApproved !== undefined;
	},
	/** Name of checked field on owner */
	ownerField: "verseApproved",
};
