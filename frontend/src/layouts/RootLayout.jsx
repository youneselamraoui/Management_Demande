import { Outlet, ScrollRestoration } from "react-router-dom";
import AppShell from "../components/AppShell";

const CURRENT_USER = { name: "ECI", role: "" };

export default function RootLayout() {
  return (
    <>
      <AppShell user={CURRENT_USER}>
        <Outlet context={{ user: CURRENT_USER }} />
      </AppShell>
      <ScrollRestoration />
    </>
  );
}
