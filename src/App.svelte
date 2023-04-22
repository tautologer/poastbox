<script lang="ts">
  import { RichText } from "@atproto/api";
  import { slide } from "svelte/transition";
  import { agent, currentToast, errorToast, settings, successToast } from "./lib/stores";
  import { attemptResumeSession, logout } from "./lib/auth";
  import LogIn from "./lib/LogIn.svelte";
  import PostInput from "./lib/PostInput.svelte";
  import { sleep } from "./lib/utils";
  import { ls } from "./lib/localStorage";
  import type { Post, PostRef } from "./lib/types";

  const VERSION = "2023-03-22.3";

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

  // read saved editor state from localStorage
  const savedPosts = ls
    .keys("editor.")
    .map((key) => ls.get(key, null))
    .filter((p) => !!p);
  let posts: Post[] = savedPosts.length ? savedPosts : [{ text: "" }];

  const post = async (index: number, reply?: { root: PostRef; parent: PostRef }): Promise<PostRef | undefined> => {
    // we have to re-assign the post to trigger the <PostInput/> to re-render, mutating the object won't work
    posts[index] = { ...posts[index], posting: true };
    let result;
    const richText = new RichText({ text: posts[index].text });
    try {
      await richText.detectFacets($agent);
      result = await $agent.post({
        text: richText.text,
        facets: richText.facets,
        reply,
      });
      if (import.meta.env.DEV) ls.set("postedUris", [...ls.get("postedUris", []), result.uri]);
      posts[index] = { ...posts[index], posted: true };
    } catch (e) {
      console.error(e);
    } finally {
      // delete the posting property from the post
      const { posting, ...rest } = posts[index];
      posts[index] = rest;
      return result;
    }
  };

  const postThread = async () => {
    const isThread = posts.length > 1;
    if (!posts.every((p) => p.text.length > 0)) {
      errorToast(isThread ? "Every post must have some text." : "Please enter some text to post.");
      return;
    }
    const _posts = posts.map((p) => ({ ...p, richText: new RichText({ text: p.text }) }));
    if (_posts.some((p) => p.richText.graphemeLength > 300)) {
      errorToast(
        isThread ? "Every post must have less than 300 characters." : "Please enter less than 300 characters."
      );
      return;
    }

    // the first post is a special case becuase it is the "root" post
    const root = await post(0);
    if (!root) {
      errorToast("Failed to post" + isThread ? " thread." : ".");
      return;
    }

    let parent: PostRef = root;
    for (let i = 1; i < _posts.length; i++) {
      const result = await post(i, { root, parent });
      if (!result) {
        errorToast("Failed to post thread.");
        return;
      }
      parent = result;
    }

    // TODO later store this to localStorage so we can show your posted threads
    ls.keys("editor.").forEach((key) => ls.delete(key));

    successToast(isThread ? "Thread posted!" : "Posted successfully!");
    await sleep(2000); // let's take a few seconds to savor the moment

    posts = [{ text: "" }];
  };

  const addPostToThread = () => {
    posts = [...posts, { text: "" }];
  };
  const removeLastPostFromThread = () => {
    if (posts.length > 1) {
      posts = posts.slice(0, -1);
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
  <h2>Connecting to bluesky...</h2>
{:then}
  {#if page === "home"}
    {#if $agent}
      {#each posts as post, index}
        <PostInput bind:post persistenceKey={`editor.${index}`} />
      {/each}

      {#if $settings.showThreadButtons}
        {#if posts.length > 1}
          <button on:click={removeLastPostFromThread}>-</button>
        {/if}
        <button on:click={addPostToThread}>+</button>
      {/if}
      <p>
        <button on:click={postThread} disabled={posts.some((p) => p.text.length < 1 || p.posting || p.posted)}>
          {posts.length > 1 ? "Post Thread" : "Post"}
        </button>
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
    <h5>Version {VERSION}</h5>
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
