import { DEFAULT_MODE } from "@/lib/mode";
import { ModeProvider } from "@/components/entry/ModeProvider";
import { AppShell } from "@/components/entry/AppShell";

// Static export: the real mode is read from the cookie on the client (see
// ModeProvider + the no-flash script in layout). This is just the seed.
export default function Home() {
  return (
    <ModeProvider initialMode={DEFAULT_MODE}>
      <AppShell />
    </ModeProvider>
  );
}
