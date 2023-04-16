import { BskyAgent } from "@atproto/api";
import { ls } from "./localStorage";
import { agent, errorToast, settings, successToast, type Settings } from "./stores";

const persistSession = (event: any, sess: any) => {
  // TODO: this is a bit of a hack, but it works
  // we can't easily get the current settings from the store because we're outside a component context
  // and i don't want to drill it down and deal with subscriptions and stuff
  const rememberMe = ls.get("poastbox.rememberMe", false);
  if (rememberMe) {
    ls.set("poastbox.session", sess);
  }
};

export const attemptLogin = async (service: string, handle: string, password: string, rememberMe: boolean) => {
  if (service && handle && password) {
    // clean up and save settings
    if (handle.startsWith("@")) handle = handle.slice(1);
    settings.setSetting("service", service);
    settings.setSetting("handle", handle);
    settings.setSetting("rememberMe", rememberMe);

    // construct agent & attempt login
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
      }
    } catch (e) {
      console.error(e);
      errorToast("Login failed. Check your service, handle, and password.", 2000);
    } finally {
      password = "";
    }
  } else {
    errorToast("Please enter your service, handle, and password.", 2000);
  }
};

export const attemptResumeSession = async (settings: Settings) => {
  const session = ls.get("poastbox.session", null);
  if (session) {
    const _agent = new BskyAgent({
      service: settings.service,
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
      ls.set("poastbox.session", null);
    }
  }
};

export const logout = () => {
  agent.set(null);
  ls.set("poastbox.session", null);
  successToast("Logged out");
};
