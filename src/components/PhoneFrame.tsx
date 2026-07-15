import React from 'react';

/**
 * Native (iOS/Android) passthrough. The "phone frame" chrome only exists on
 * the web preview (see PhoneFrame.web.tsx) — on native the app already runs
 * full-screen inside a real phone, so there's nothing to wrap.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
