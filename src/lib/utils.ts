import { ls } from "./localStorage";
import { agent } from "./stores";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// debugging utils

if (import.meta.env.DEV) {
  Object.assign(window, {
    ls,
  });

  agent.subscribe((currentAgent) => {
    Object.assign(window, {
      deleteAllPosts: async () => {
        const uris = ls.get("postedUris", []);
        for (const uri of uris) {
          await currentAgent.deletePost(uri);
        }
        const newUris = ls.get("postedUris", uris);
        ls.set(
          "postedUris",
          newUris.filter((uri) => !uris.includes(uri))
        );
      },
    });
  });
}
