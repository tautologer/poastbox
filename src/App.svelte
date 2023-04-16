<script lang="ts">
  import { BskyAgent, RichText } from "@atproto/api";
  import { slide } from "svelte/transition";
  import { agent, currentToast, errorToast, settings, successToast } from "./lib/stores";
  import { attemptResumeSession, logout } from "./lib/auth";
  import LogIn from "./lib/LogIn.svelte";
  import PostInput from "./lib/PostInput.svelte";

  const initialSettings = $settings;
  const attemptResumePromise = attemptResumeSession(initialSettings);

  type Page = "home" | "settings";
  let page: Page = "home";
  const toggleSettings = () => {
    if (page !== "settings") {
      page = "settings";
    } else {
      page = "home";
    }
  };
  let showThreadButtons = $settings.showThreadButtons;
  $: settings.setSetting("showThreadButtons", showThreadButtons);

  let posts: string[] = [""];
  let posting = [false];
  let posted = [false];

  const postThread = async () => {
    if (!posts.every((p) => p.length > 0)) {
      errorToast("Every post must have some text.");
      return;
    }
    const richTexts = posts.map((p) => new RichText({ text: p }));
    if (richTexts.some((r) => r.graphemeLength > 300)) {
      errorToast("Every post must have less than 300 characters.");
      return;
    }

    // the first post is a special case becuase it is the "root" post
    let root: Awaited<ReturnType<BskyAgent["post"]>>;
    posting[0] = true;
    await richTexts[0].detectFacets($agent);
    try {
      root = await $agent.post({
        text: richTexts[0].text,
        facets: richTexts[0].facets,
      });
      posted[0] = true;
    } catch (e) {
      console.error(e);
      errorToast("Post failed.");
    } finally {
      posting[0] = false;
    }

    let parent: Awaited<ReturnType<BskyAgent["post"]>> = root;
    for (let i = 1; i < richTexts.length; i++) {
      posting[i] = true;
      await richTexts[i].detectFacets($agent);
      try {
        parent = await $agent.post({
          text: richTexts[i].text,
          facets: richTexts[i].facets,
          reply: {
            root,
            parent,
          },
        });
        posted[i] = true;
      } catch (e) {
        console.error(e);
        errorToast("Post failed.");
        return;
      } finally {
        posting[i] = false;
      }
    }

    posts = [""];
    posting = [false];
    posted = [false];
    successToast("Thread posted!");
  };

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

  const addPostToThread = () => {
    posts = [...posts, ""];
    posting = [...posting, false];
    posted = [...posted, false];
  };
  const removeLastPostFromThread = () => {
    if (posts.length > 1) {
      posts = posts.slice(0, -1);
      posting = posting.slice(0, -1);
      posted = posted.slice(0, -1);
    }
  };
</script>

<button on:click={toggleSettings} id="settingsToggle">⚙️</button>

{#if $currentToast}
  <div id="toast" style="background-color: {$currentToast.color ?? 'blue'}; color: white;" transition:slide={{}}>
    {$currentToast.text}
  </div>
{/if}

<h1>poastbox</h1>

{#await attemptResumePromise}
  <h2>Loading...</h2>
{:then}
  {#if page === "home"}
    {#if $agent}
      {#each posts as post, index}
        <PostInput bind:text={posts[index]} posting={posting[index]} posted={posted[index]} />
      {/each}

      {#if $settings.showThreadButtons}
        <button on:click={addPostToThread}>+</button>
        {#if posts.length > 1}
          <button on:click={removeLastPostFromThread}>-</button>
        {/if}
      {/if}
      <p>
        {#if posts.length === 1}
          <button on:click={post} disabled={posted[0] || posting[0]}>Post</button>
        {:else}
          <button on:click={postThread} disabled={posted.some((t) => t) || posting.some((t) => t)}>Post Thread</button>
        {/if}
      </p>
    {:else}
      <h2>post to bluesky. that's it</h2>
      <LogIn />
    {/if}
  {:else if page === "settings"}
    <h2>Settings</h2>
    {#if $agent}
      <p>Logged in as {$settings.handle}</p>
    {/if}
    <p>Show thread controls: <input type="checkbox" bind:checked={showThreadButtons} /></p>
    <button
      on:click={async () => {
        await logout();
        page = "home";
      }}>Logout</button
    >
    <!-- <button on:click={() => (page = "home")}>Back</button> -->
  {:else}
    <h2>404</h2>
    <p>you shouldn't be seeing this, how did you get here?</p>
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

  #settingsToggle {
    position: fixed;
    top: 1em;
    left: 1em;
    border-radius: 50%;
    padding: 10px;
    z-index: 100;
  }
</style>
