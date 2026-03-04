const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] relative overflow-hidden">
      {/* Background glow effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }}
      />

      <div className="relative z-10 text-center px-6">
        {/* Animated border card */}
        <div className="relative p-px rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-win), var(--accent-primary))',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 4s ease infinite',
            }}
          />
          <div className="relative bg-[var(--surface-card)] rounded-2xl p-10 sm:p-14">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[var(--text-primary)]">
              <span className="text-[var(--accent-primary)]">V</span>CM
            </h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[var(--text-secondary)] mt-2">
              Virtual Career Mode
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              EAFC26 League Management
            </p>

            <a
              href={`${API_URL}/auth/discord`}
              className="inline-flex items-center gap-3 bg-[var(--accent-primary)] hover:brightness-110 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all mt-8 hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
              </svg>
              Login with Discord
            </a>
          </div>
        </div>

        <a
          href="/tools/schedule-generator"
          className="inline-block mt-8 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          Try our free Schedule Generator &rarr;
        </a>
      </div>
    </div>
  );
}
