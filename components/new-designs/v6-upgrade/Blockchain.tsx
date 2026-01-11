import React from "react";
import Image from "next/image";
import { FileKey } from "lucide-react";
import { ShieldCheck } from "lucide-react";

interface SectionProps {
  id: string;
  className?: string;
  backgroundImage?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  id,
  className = "",
  backgroundImage,
  children,
}) => (
  <section
    id={id}
    className={`section-background ${className}`}
    style={
      backgroundImage
        ? { backgroundImage: `url("${backgroundImage}")` }
        : undefined
    }
  >
    <div className="linear-overlay"></div>
    <div className="section-content">{children}</div>
  </section>
);

const Blockchain: React.FC = () => {
  return (
    <Section
      id="blockchain"
      className="bg-background/30 dark:bg-zinc-900/30 backdrop-blur-md rounded-2xls"
    >
      <div className="linear-overlay opacity-90"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 blur-[120px] rounded-full"></div>
      </div>
      <div className="section-content">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 text-purple-500 dark:bg-primary/10 dark:text-primary text-xs font-bold mb-4 w-fit">
              CHAPTER V: FUTURE-PROOF INTEGRITY
            </div>
            <h2 className="max-w-4xl mx-auto text-4xl md:text-6xl font-display font-black tracking-tight mb-8 dark:text-gray-200">
              Immutable{" "}
              <span className="text-purple-500 dark:text-primary">
                Company Records
              </span>
            </h2>
            <p className="w-full px-4 mx-auto text-lg md:text-2xl text-black dark:text-gray-50 mb-12 leading-relaxed font-body md:max-w-4xl ">
              The definitive evolution of corporate transparency. Every critical
              transaction is hashed and tracked on a decentralized ledger,
              creating an unbreakable chain of trust.
            </p>
            <div className="flex flex-col gap-6 mt-4 px-4">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-purple-500 dark:text-primary">
                    <FileKey />
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display dark:text-gray-200">
                    Public Verification Protocol
                  </h4>
                  <p className="text-text text-md font-body">
                    Transactions are recorded publicly and can be verified by
                    stakeholders through our specialized DAPP explorer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-purple-500 dark:text-primary">
                    <ShieldCheck />
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display dark:text-gray-200">
                    Zero-Knowledge Auditing
                  </h4>
                  <p className="text-text text-md font-body">
                    Prove compliance and financial health without exposing
                    sensitive proprietary data.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <span className="px-4 py-1.5 bg-purple-500 text-white dark:bg-primary dark:text-black text-xs font-black uppercase tracking-widest rounded-full">
                Coming Soon
              </span>
              <p className="dark:text-primary text-sm font-bold font-display italic">
                Arriving in v6 Q4 2026
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="w-full h-full flex just items-center">
              <Image
                src="/images/Blockchain-records.png"
                alt="Blockchain Illustration"
                width={900}
                height={600}
                className="mx-auto bg-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Blockchain;
