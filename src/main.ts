import "./app.css";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
});

import { registerServiceWorker } from "./lib/registerServiceWorker";
registerServiceWorker();

export default app;
