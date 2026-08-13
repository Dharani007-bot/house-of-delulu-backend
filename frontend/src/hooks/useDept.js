import { useLocation } from "react-router-dom";

// Reads the department straight from the URL — /men/... or /women/...
// Falls back to "women" if neither prefix matches (e.g. on legacy routes).
export default function useDept() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/men"))   return "men";
  if (pathname.startsWith("/women")) return "women";
  return "women";
}