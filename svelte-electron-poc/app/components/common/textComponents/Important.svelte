<script lang="ts">
	export let id: string;
</script>

<span {id} {...$$restProps} class="important"><slot /></span>

<style lang="scss">
	.important {
		font-weight: 900;
		color: red;
	}
</style>
