<script lang="ts">
	import Content from "@components/common/textComponents/Content.svelte";

	export let id: string;
	export let contents: int[];
</script>

<div class="document" {id}>
	{#each contents as content}
		<Content {...content} />
	{/each}
</div>
