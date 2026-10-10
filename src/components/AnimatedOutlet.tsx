import { Outlet } from "react-router-dom";

/** Renders the matched child route without remounting on every path change. */
export function AnimatedOutlet() {
  return <Outlet />;
}
