import React from "react";

const GoogleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Google"
  >
    <path
      fill="#4285F4"
      d="M21.6 12.227c0-.68-.06-1.332-.177-1.954H12v3.7h5.1c-.216 1.16-.86 2.145-1.83 2.81v2.34h2.96c1.732-1.595 2.65-3.95 2.65-6.9z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.43 0 4.47-.8 5.96-2.17l-2.96-2.34c-.82.55-1.88.88-3 .88-2.31 0-4.27-1.56-4.97-3.66H3.99v2.3C5.46 19.8 8.5 22 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M7.03 13.01a5.95 5.95 0 010-3.79V6.92H3.99A9.99 9.99 0 002 12c0 1.63.39 3.17 1.07 4.55l3.96-3.54z"
    />
    <path
      fill="#EA4335"
      d="M12 6.5c1.32 0 2.5.45 3.44 1.33l2.59-2.59C16.48 3.65 14.43 3 12 3 8.5 3 5.46 5.2 3.99 7.88l3.04 2.3C7.73 8.06 9.69 6.5 12 6.5z"
    />
  </svg>
);

const GitHubLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="GitHub"
  >
    <path
      fill="currentColor"
      d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.2-.8.1-.8.1-.8 1.4.1 2.1 1.4 2.1 1.4 1.2 2 3.2 1.4 4 .9.1-.8.5-1.4.9-1.8-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.4-3.1-.1-.3-.6-1.6.1-3.3 0 0 1.1-.4 3.4 1.2a11.7 11.7 0 016.2 0c2.3-1.6 3.4-1.2 3.4-1.2.7 1.7.2 3 .1 3.3.9.8 1.4 1.8 1.4 3.1 0 4.5-2.8 5.4-5.4 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0012 .5z"
    />
  </svg>
);

const MicrosoftLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Microsoft"
  >
    <rect x="3" y="3" width="8" height="8" fill="#F35325" />
    <rect x="13" y="3" width="8" height="8" fill="#81BC06" />
    <rect x="3" y="13" width="8" height="8" fill="#05A6F0" />
    <rect x="13" y="13" width="8" height="8" fill="#FFBA08" />
  </svg>
);

const OracleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 120 40"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Oracle"
  >
    <rect width="120" height="40" rx="4" fill="#E74C3C" />
    <text
      x="60"
      y="25"
      textAnchor="middle"
      fill="#fff"
      fontWeight="700"
      fontSize="14"
    >
      ORACLE
    </text>
  </svg>
);

const Security: React.FC = () => {
  return (
    <section
      id="security"
      className="bg-slate-100 dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl py-20"
    >
      <div className="container mx-auto flex flex-col items-center justify-center">
        <div className="w-[255px] px-4 py-2 rounded-full border border-purple-500 text-purple-500 dark:text-[#2bee79] dark:border-[#2bee79] text-xs font-semibold mb-6">
          CHAPTER VI: FOUNDATION OF TRUST
        </div>
        <h3 className="max-w-4xl mx-auto text-5xl md:text-6xl font-display font-black tracking-tight mb-8 dark:dark:text-gray-200">
          <span className="text-purple-500 dark:text-[#2bee79]">
            Un-Wavering
          </span>{" "}
          Security
        </h3>
        <p className="w-full px-4 mx-auto text-base md:text-lg text-black dark:text-gray-50 text-center leading-relaxed font-body md:max-w-4xl mb-20">
          Protect your data with enterprise controls: multi‑factor
          authentication, end‑to‑end encryption, and auditing. OnTarget ERP
          includes system‑wide geo‑IP blocking across all accounts, automated
          brute‑force detection, and events logging for compliance.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <div className="flex flex-col items-center gap-3">
            <GoogleLogo className="w-12 h-12" />
            <span className="text-[10px] font-bold tracking-widest text-text-muted">
              GOOGLE
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <GitHubLogo className="w-12 h-12 dark:text-gray-200" />
            <span className="text-[10px] font-bold tracking-widest text-text-muted">
              GITHUB
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <MicrosoftLogo className="w-12 h-12" />
            <span className="text-[10px] font-bold tracking-widest text-text-muted">
              MICROSOFT
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <OracleLogo className="w-16 h-8" />
            <span className="text-[10px] font-bold tracking-widest text-text-muted">
              ORACLE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
