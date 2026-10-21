import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { BridgeLoader } from "./BridgeLoader";

export function VendorOnlyRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "vendor" | "customer">("loading");

  useEffect(() => {
    let active = true;
    apiFetch("/vendors/me")
      .then((data) => { if (active) setStatus(data.vendor ? "vendor" : "customer"); })
      .catch(() => { if (active) setStatus("customer"); });
    return () => { active = false; };
  }, []);

  if (status === "loading") return <div className="grid min-h-screen place-items-center bg-[#11110f]"><BridgeLoader label="Checking your storefront" /></div>;
  if (status === "customer") return <Navigate to="/profile" replace />;
  return <>{children}</>;
}
