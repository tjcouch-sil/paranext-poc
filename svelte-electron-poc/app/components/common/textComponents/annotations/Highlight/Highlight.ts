import { isContentText } from "@app/util/Util";
import type { IAnnotationDefinition } from "../../TextComponentTypes";
import Highlight from "./Highlight.svelte";

export const ExclamationHighlight: IAnnotationDefinition = {
	annotation: Highlight,
	annotates: (content) => {
		return isContentText(content) && content.contents?.includes("!");
	},
	ownerField: "!",
};
