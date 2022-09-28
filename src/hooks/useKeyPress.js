import { useEffect } from "react";

const useKeyPress = (handlers = {}, dependencies = []) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!event.repeat) {
        handlers[event.code]?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handlers, ...dependencies]);
};

export default useKeyPress;
