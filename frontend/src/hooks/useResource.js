import { useCallback, useEffect, useRef, useState } from "react";
import { clearCache } from "../api";

export default function useResource(key, loader) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const previousKey = useRef(null);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: !!key,
    error: null,
    errorStatus: null,
  });
  const reload = useCallback(() => {
    clearCache();
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      errorStatus: null,
    }));
    setRevision((v) => v + 1);
  }, []);
  useEffect(() => {
    let active = true;
    if (!key) {
      previousKey.current = key;
      setState({ data: null, loading: false, error: null });
      return;
    }
    const sameKey = previousKey.current === key;
    previousKey.current = key;
    setState((prev) => ({
      data: sameKey ? prev.data : null,
      loading: true,
      error: null,
      errorStatus: null,
    }));
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (active)
          setState((prev) => ({
            data: sameKey ? prev.data : null,
            loading: false,
            error: error.message,
            errorStatus: error.status || null,
          }));
      });
    return () => {
      active = false;
    };
  }, [key, revision]);
  return {
    ...(previousKey.current === key
      ? state
      : { data: null, loading: !!key, error: null, errorStatus: null }),
    reload,
  };
}
