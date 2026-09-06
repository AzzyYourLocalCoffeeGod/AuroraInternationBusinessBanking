import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MeridianDashboard from "./ui skeleton.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MeridianDashboard />
  </StrictMode>
);