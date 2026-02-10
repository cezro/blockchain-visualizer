"use client";

export function ValidationIndicator({ valid }: { valid: boolean }) {
  return (
    <section className="hud-panel mb-6 px-6 py-5 text-center text-sm font-semibold uppercase tracking-wider">
      <span
        role="status"
        className={valid ? "text-[var(--hud-valid)]" : "text-[var(--hud-invalid)]"}
      >
        {valid ? "Chain Valid" : "Chain Invalid"}
      </span>
    </section>
  );
}

