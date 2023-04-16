<script lang="ts">
  import { RichText } from "@atproto/api";

  export let text: string = "";
  export let posting: boolean;
  export let posted: boolean;

  // set textarea height based on number of lines
  let height: string = "3em";
  $: height = Math.min(text.split("\n").length * 1.2 + 0.5, 20) + "em";

  // reactive text stuff
  let richText: RichText;
  $: richText = new RichText({ text });
</script>

<textarea bind:value={text} disabled={posting || posted} style={`height: ${height};`} />
{#if posted}
  <p>Posted ✅</p>
{:else if posting}
  <p>Posting...</p>
{:else}
  <p>{richText.graphemeLength} / 300 chars</p>
{/if}

<style>
  textarea {
    width: 80vw;
    max-width: 400px;
    min-height: 3em;
    max-height: 20em;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }
</style>
