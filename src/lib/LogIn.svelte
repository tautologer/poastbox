<script lang="ts">
  import { settings } from "./stores";
  import { attemptLogin } from "./auth";

  let { service, handle, rememberMe } = $settings;
  let password = "";
  let loggingIn = false;
</script>

{#if loggingIn}
  <p>Logging in...</p>
{:else}
  <p>
    Service
    <input type="text" bind:value={service} />
  </p>
  <p>
    Handle
    <input type="text" bind:value={handle} placeholder="example.bsky.social" />
  </p>
  <p>
    Password
    <input type="password" bind:value={password} />
  </p>
  <p>
    <input type="checkbox" bind:checked={rememberMe} /> Remember me
  </p>
  <button on:click={() => attemptLogin(service, handle, password, rememberMe)}>Login</button>
  <p>Don't enter your bluesky password into websites or apps that you don't trust.</p>
  <p>You can view this app's source code <a href="https://github.com/tautologer/poastbox">on GitHub</a>.</p>
{/if}
