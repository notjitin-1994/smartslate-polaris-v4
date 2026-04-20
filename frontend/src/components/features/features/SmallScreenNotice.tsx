import StarryBackground from '@/components/StarryBackground';

type SmallScreenNoticeProps = {
  minWidthPx?: number;
};

export function SmallScreenNotice({ minWidthPx = 800 }: SmallScreenNoticeProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#020C1B] to-[#0A1628] px-6 py-10">
      <StarryBackground />
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-6 inline-flex items-center gap-3">
          <img src="/images/logos/logo.png" alt="Smartslate" className="h-10 w-auto" />
          <span className="font-semibold tracking-wide text-white/80">Polaris</span>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h1 className="font-heading text-2xl font-bold text-white">
            Best experienced on a larger screen
          </h1>
          <p className="mt-3 text-white/70">
            For clarity and the full Polaris experience, please visit on a tablet, laptop, or
            desktop.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-left">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="bg-primary-400/40 mb-2 h-3 w-16 rounded" />
              <div className="h-2 w-20 rounded bg-white/20" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="bg-secondary-500/40 mb-2 h-3 w-16 rounded" />
              <div className="h-2 w-20 rounded bg-white/20" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 h-3 w-16 rounded bg-white/30" />
              <div className="h-2 w-20 rounded bg-white/20" />
            </div>
          </div>

          <div className="mt-7 text-sm text-white/60">
            Minimum width: <span className="font-medium text-white/80">{minWidthPx}px</span>
          </div>
        </div>

        <div className="mt-6 text-xs text-white/50">
          Having trouble? Try rotating your device or opening Smartslate on desktop.
        </div>
      </div>
    </div>
  );
}

export default SmallScreenNotice;
