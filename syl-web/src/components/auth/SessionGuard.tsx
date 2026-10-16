import { useEffect, useRef, useState } from "react";
import { AuthDialog } from "./AuthDialog";

/**
 * Mounts once at the app root. Listens for `syl:session-expired` events
 * dispatched by the axios interceptor when a 401 is received while the user
 * had an active session. Opens the AuthDialog and, after a successful login,
 * navigates back to the page the user was on.
 */
export function SessionGuard() {
  const [open, setOpen] = useState(false);
  const returnToRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ returnTo: string }>).detail;
      returnToRef.current = detail?.returnTo;
      setOpen(true);
    };

    window.addEventListener("syl:session-expired", handler);
    return () => window.removeEventListener("syl:session-expired", handler);
  }, []);

  return (
    <AuthDialog
      isOpen={open}
      onClose={() => {
        setOpen(false);
        returnToRef.current = undefined;
      }}
      defaultReturnTo={returnToRef.current}
    />
  );
}
