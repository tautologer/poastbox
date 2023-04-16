<script lang="ts">
  import { RichText } from "@atproto/api";
  import { slide } from "svelte/transition";
  import { agent, currentToast, errorToast, settings, successToast } from "./lib/stores";
  import { attemptResumeSession, logout } from "./lib/auth";
  import LogIn from "./lib/LogIn.svelte";
  import PostInput from "./lib/PostInput.svelte";

  // attempt resuming the session with the stored settings
  attemptResumeSession($settings);

  let posts: string[] = [""];

  let posting = [false];
  let posted = [false];
  const post = async () => {
    if (!posts.every((p) => p.length > 0)) {
      errorToast("Please enter some text to post."); // TODO change this once threading is implemented
      return;
    }
    const richText = new RichText({ text: posts[0] });
    if (richText.graphemeLength > 300) {
      errorToast("Please enter less than 300 characters."); // TODO change this once threading is implemented
      return;
    }
    posting[0] = true;
    try {
      await richText.detectFacets($agent);
      await $agent.post({
        text: richText.text,
        facets: richText.facets,
      });
      successToast("Posted!");
      posted[0] = true;
      // reset everything at the end
      posts = [""];
      posting = [false];
      posted = [false];
    } catch (e) {
      console.error(e);
      errorToast("Post failed.");
    } finally {
      posting[0] = false;
    }
  };
  // toast
</script>

{#if $currentToast}
  <div id="toast" style="background-color: {$currentToast.color ?? 'blue'}; color: white;" transition:slide={{}}>
    {$currentToast.text}
  </div>
{/if}

<h1>poastbox</h1>

<!-- if you're looking at this, don't judge me... i hacked this together in like an hour lol -->

{#await attemptResumeSession($settings)}
  <h2>Loading...</h2>
{:then}
  {#if $agent}
    {#each posts as post, index}
      <PostInput bind:text={posts[index]} posting={posting[index]} posted={posted[index]} />
    {/each}

    <button on:click={post}>Post</button>
    <br />
    <br />
    <button on:click={logout}>Logout</button>
  {:else}
    <h2>post to bluesky. that's it</h2>
    <LogIn />
  {/if}
{/await}

<style>
  #toast {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 10px;
    text-align: center;
    z-index: 100;
  }
</style>
