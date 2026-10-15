import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_CONTENT } from "./content";
import { newProgress, validProgress } from "./engine";
import { requestJson, jsonRequest } from "../client";
const same = (a, b) =>
  a &&
  b &&
  ["version", "setId", "position", "full", "fatima"].every(
    (name) => a[name] === b[name],
  );
function persist(key, progress, content) {
  try {
    localStorage.setItem(key, JSON.stringify({ progress, content }));
    return true;
  } catch {
    return false;
  }
}
export function useRosary() {
  const { data: session, status } = useSession();
  const account = session?.user?.id;
  const key = `panteralab.rosary.v1.${account || "visitor"}`;
  const [content, setContent] = useState(DEFAULT_CONTENT),
    [progress, setProgress] = useState(null);
  const [loadedKey, setLoadedKey] = useState(null),
    [revision, setRevision] = useState(0);
  const [conflict, setConflict] = useState(null),
    [saveState, setSaveState] = useState("local"),
    [retry, setRetry] = useState(0);
  const dirty = useRef(false),
    inFlight = useRef(false),
    generation = useRef(0),
    current = useRef(null),
    storageHealthy = useRef(true);
  useEffect(() => {
    if (status === "loading") return;
    const gen = ++generation.current;
    let stopped = false;
    dirty.current = false;
    async function restore() {
      let local = null;
      try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (saved?.content && validProgress(saved.progress, saved.content))
          local = saved;
      } catch {
        /* no usable local cache */
      }
      let latest = DEFAULT_CONTENT;
      try {
        latest = (await requestJson("/api/rosario/conteudo")).content;
      } catch {
        /* bundled content remains available */
      }
      let remote = null;
      if (account) {
        try {
          remote = await requestJson("/api/rosario/progresso");
        } catch {
          /* preserve local prayer */
        }
      }
      if (stopped || gen !== generation.current) return;
      const remoteValid =
        remote?.progress && validProgress(remote.progress, remote.content);
      const chosen =
        local ||
        (remoteValid
          ? { progress: remote.progress, content: remote.content }
          : { progress: null, content: latest });
      current.current = chosen;
      setContent(chosen.content);
      setProgress(chosen.progress);
      setRevision(remote?.revision || 0);
      setConflict(
        local && remoteValid && !same(local.progress, remote.progress)
          ? { ...remote, label: "Na sua conta" }
          : null,
      );
      storageHealthy.current =
        !chosen.progress || persist(key, chosen.progress, chosen.content);
      setSaveState(
        !storageHealthy.current
          ? "memory"
          : account && remote
            ? "saved"
            : "local",
      );
      setLoadedKey(key);
    }
    restore();
    return () => {
      stopped = true;
    };
  }, [key, account, status]);
  useEffect(() => {
    if (
      loadedKey !== key ||
      !account ||
      !progress ||
      conflict ||
      !dirty.current
    )
      return;
    const gen = generation.current;
    const timer = setTimeout(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      dirty.current = false;
      setSaveState("saving");
      try {
        const result = await requestJson(
          "/api/rosario/progresso",
          jsonRequest("PUT", {
            progress,
            expectedRevision: revision,
            accountId: account,
          }),
        );
        if (gen === generation.current) {
          setRevision(result.revision);
          setSaveState("saved");
        }
      } catch (error) {
        if (gen !== generation.current) return;
        if (error.status === 409) {
          setConflict({ ...error.data, label: "Em outro dispositivo" });
          setRevision(error.data.revision);
        }
        setSaveState(storageHealthy.current ? "local" : "memory");
      } finally {
        inFlight.current = false;
        if (dirty.current) setRetry((value) => value + 1);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [loadedKey, key, account, progress, conflict, revision, retry]);
  useEffect(() => {
    function storage(event) {
      if (loadedKey !== key || event.key !== key || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue);
        if (
          incoming?.content &&
          validProgress(incoming.progress, incoming.content) &&
          !same(incoming.progress, current.current?.progress)
        )
          setConflict({
            ...incoming,
            revision,
            label: "Em outra aba",
            localTab: true,
          });
      } catch {
        /* invalid cache */
      }
    }
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, [key, revision, loadedKey]);
  useEffect(() => {
    function online() {
      if (account) {
        dirty.current = true;
        setRetry((value) => value + 1);
      }
    }
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [account]);
  // Persist in the user action itself, before an interruption can close the page.
  const update = useCallback(
    (next, edition = content) => {
      const value =
        typeof next === "function" ? next(current.current?.progress) : next;
      const updated = { ...value, updatedAt: new Date().toISOString() };
      current.current = { progress: updated, content: edition };
      dirty.current = true;
      setContent(edition);
      setProgress(updated);
      storageHealthy.current = persist(key, updated, edition);
      if (!storageHealthy.current) setSaveState("memory");
    },
    [key, content],
  );
  function choose(useOther) {
    if (useOther && conflict?.progress)
      update(conflict.progress, conflict.content);
    else if (progress) update(progress);
    if (!conflict?.localTab) setRevision(conflict?.revision || 0);
    setConflict(null);
    setRetry((value) => value + 1);
  }
  return {
    content,
    progress,
    ready: loadedKey === key && status !== "loading",
    conflict,
    choose,
    saveState,
    authenticated: Boolean(account),
    start: (setId, options) => update(newProgress(setId, options, content)),
    go: (position) => update((value) => ({ ...value, position })),
    retrySave: () => {
      dirty.current = true;
      setRetry((value) => value + 1);
    },
  };
}
