import { isContentText } from "@app/util/Util";
import type { IAnnotationDefinition } from "../../TextComponentTypes";
import Highlight from "./Highlight.svelte";

export const ExclamationHighlight: IAnnotationDefinition = {
	component: Highlight,
	annotates: (content) => {
		if (isContentText(content)) {
			return (content.contents as string)?.includes("!");
		}
		return false;
	},
};
