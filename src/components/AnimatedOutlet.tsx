import { Outlet, useLocation } from "react-router-dom";

export function AnimatedOutlet() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Outlet />
    </div>
  );
}
