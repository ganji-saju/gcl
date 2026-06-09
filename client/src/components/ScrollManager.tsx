import { useEffect } from "react";
import { useLocation } from "wouter";

function scrollToRouteTarget() {
  const hash = window.location.hash.replace("#", "");

  if (hash) {
    const target = document.getElementById(decodeURIComponent(hash));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }

  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

export default function ScrollManager() {
  const [location] = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(scrollToRouteTarget);
    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToRouteTarget);
    return () => window.removeEventListener("hashchange", scrollToRouteTarget);
  }, []);

  return null;
}
