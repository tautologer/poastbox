<script lang="ts">
  import { RichText } from "@atproto/api";

  export let text: string = "";
  export let posting: boolean;
  export let posted: boolean;

  // reactively set textarea height based on scroll height
  let textarea: HTMLTextAreaElement;
  const adjustHeight = (text: string) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + 2 + "px";
    }
  };
  $: adjustHeight(text);

  // reactive text stuff
  let richText: RichText;
  $: richText = new RichText({ text });

  let graphemeLength: number;
  $: graphemeLength = richText.graphemeLength;
  let color: string = "black";
  $: color = graphemeLength > 300 ? "red" : "inherit";
</script>

<textarea bind:value={text} disabled={posting || posted} bind:this={textarea} />
{#if posted}
  <p>Posted ✅</p>
{:else if posting}
  <p>Posting...</p>
{:else}
  <p style={`color: ${color};`}>{graphemeLength} / 300 chars</p>
{/if}

<style>
  textarea {
    width: 80vw;
    max-width: 400px;
    /* 54px is the height of 3 lines */
    min-height: 54px;
    max-height: 20em;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }
</style>
