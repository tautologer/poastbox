<script lang="ts">
  import { BskyAgent, RichText } from "@atproto/api";
  import { slide } from "svelte/transition";
  import { agent } from "./lib/agentStore";

  // yes, this code is a mess. there should be at least 4 components factored out of this.
  // but this was a quick afternoon hack, plz don't judge me

  const lsGet = (key: string, _default?: any): any => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return _default;
  };
  const lsSet = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value));

  let service = lsGet("poastbox.service", "https://bsky.social");
  let handle = lsGet("poastbox.handle", "");
  let session = lsGet("poastbox.session");
  let password = "";
  let rememberMe = lsGet("poastbox.rememberMe", false);

  const persistSession = (event: any, sess: any) => {
    if (rememberMe) {
      lsSet("poastbox.session", sess);
    } else {
      // this is mostly relevant for debugging I think
      session = JSON.stringify(sess);
    }
  };

  let loggingIn = false;
  const attemptLogin = async () => {
    if (service && handle && password) {
      loggingIn = true;
      if (handle.startsWith("@")) handle = handle.slice(1);
      const _agent = new BskyAgent({
        service,
        persistSession,
      });
      try {
        const result = await _agent.login({
          identifier: handle,
          password,
        });
        if (result) {
          successToast("Logged in");
          agent.set(_agent);
          lsSet("poastbox.service", service);
          lsSet("poastbox.handle", handle);
          lsSet("poastbox.rememberMe", rememberMe);
        }
      } catch (e) {
        console.error(e);
        errorToast("Login failed. Check your service, handle, and password.");
      } finally {
        loggingIn = false;
        password = "";
      }
    } else {
      errorToast("Please enter your service, handle, and password.");
    }
  };

  const attemptResumeSession = async () => {
    if (session) {
      loggingIn = true;
      const _agent = new BskyAgent({
        service,
        persistSession,
      });
      try {
        const { success } = await _agent.resumeSession(session);
        if (success) {
          agent.set(_agent);
        } else {
          throw new Error("Failed to resume session");
        }
      } catch (e) {
        console.log(e);
        lsSet("poastbox.session", null);
      } finally {
        loggingIn = false;
      }
    }
  };
  attemptResumeSession();

  const logout = () => {
    agent.set(null);
    lsSet("poastbox.session", null);
    successToast("Logged out");
  };

  let posting = false;
  const post = async () => {
    if (!postText) {
      errorToast("Please enter some text to post.");
      return;
    }
    if (richText.length > 300) {
      errorToast("Please enter less than 300 characters.");
      return;
    }
    posting = true;
    try {
      await richText.detectFacets($agent);
      await $agent.post({
        text: richText.text,
        facets: richText.facets,
      });
      successToast("Posted!");
      postText = "";
    } catch (e) {
      console.error(e);
      alert("Post failed. Check your service, handle, and password.");
    } finally {
      posting = false;
    }
  };

  // reactive text stuff
  let postText = localStorage.getItem("poastbox.postText") || "";
  $: localStorage.setItem("poastbox.postText", postText);
  let richText: RichText;
  $: richText = new RichText({ text: postText });

  // toast
  const DEFAULT_TOAST_INTERVAL = 2000;
  let showToast = false;
  let toastMessage = "";
  let toastColor: string;
  const toast = (
    message: string,
    {
      color,
      interval,
    }: {
      color?: string;
      interval?: number;
    }
  ) => {
    toastMessage = message;
    toastColor = color;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, interval ?? DEFAULT_TOAST_INTERVAL);
  };
  const errorToast = (message: string, interval?: number) => toast(message, { color: "red", interval });
  const successToast = (message: string, interval?: number) => toast(message, { color: "green", interval });
</script>

{#if showToast}
  <div id="toast" style="background-color: {toastColor ?? 'blue'}; color: white;" transition:slide={{}}>
    {toastMessage}
  </div>
{/if}

<h1>poastbox</h1>

<!-- if you're looking at this, don't judge me... i hacked this together in like an hour lol -->

{#if $agent}
  <textarea bind:value={postText} />
  <p>{richText.length} / 300 chars</p>
  <button on:click={post}>Post</button>
  <br />
  <br />
  <button on:click={logout}>Logout</button>
{:else}
  <h2>post to bluesky. that's it</h2>
  {#if loggingIn}
    <p>Logging in...</p>
  {:else}
    <p>
      Service
      <input type="text" bind:value={service} />
    </p>
    <p>
      Handle
      <input type="text" bind:value={handle} />
    </p>
    <p>
      Password
      <input type="password" bind:value={password} />
    </p>
    <p>
      <input type="checkbox" bind:checked={rememberMe} /> Remember me
    </p>
    <button on:click={attemptLogin}>Login</button>
    <p>Don't enter your bluesky password into websites or apps that you don't trust.</p>
  {/if}
{/if}

<style>
  textarea {
    width: 80vw;
    max-width: 400px;
    height: 25vh;
    max-height: 20em;
  }

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
