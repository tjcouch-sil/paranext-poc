import type { IAnnotationDefinition } from "../../TextComponentTypes";
import Checkbox from "./Checkbox.svelte";

export const VerseApprovedCheckbox: IAnnotationDefinition = {
	annotation: Checkbox,
	annotates: (content) => {
		return content.verseApproved !== undefined;
	},
	ownerField: "verseApproved",
};
