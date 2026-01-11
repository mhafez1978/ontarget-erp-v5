import React from "react";

interface SectionProps {
  id: string;
  className?: string;
  backgroundImage?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, children }) => (
  <section
    id={id}
    className="bg-background/30 dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl"
  >
    <div className="linear-overlay"></div>
    <div className="section-content">{children}</div>
  </section>
);

const AIIntegration: React.FC = () => {
  return (
    <Section id="ai-integration" className="border border-red-600">
      <div className="w-full flex flex-col gap-8 items-center py-12 md:py-20">
        <div className="w-full flex flex-col justify-center items-center text-center md:text-left px-6 md:px-0">
          <div className="w-52 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-purple-500 dark:text-primary text-xs font-bold mb-4 mx-auto md:mx-0">
            CHAPTER III: AI INTEGRATION
          </div>
          <h2 className=" mx-auto text-5xl md:text-6xl font-display font-black tracking-tight mb-8 dark:text-gray-200">
            <span className="text-purple-500 dark:text-primary">Unleash</span>{" "}
            Hyper-Growth with AI.
          </h2>
          <p className="w-full px-4 mx-auto text-lg md:text-2xl text-black dark:text-gray-50 leading-relaxed font-body md:max-w-4xl mb-6">
            If you&apos;ve not yet integrated AI into your business operations,
            you&apos;re missing out on a transformative opportunity. OnTarget
            ERP seamlessly incorporates cutting-edge AI technologies to
            supercharge your productivity, enhance decision-making, and drive
            unprecedented brand growth.
          </p>
          <p className="w-full px-4 mx-auto text-lg md:text-2xl text-black dark:text-gray-50 leading-relaxed font-body md:max-w-4xl mb-2">
            We continue to add features as AI technology evolves. Coming soon:
            immutable business records stored on blockchain, enabling secure,
            transparent transactions that help drive trust and accountability.
            Just imagine who would not want to have immutable business records!
            <br /> <br /> I know some wont like it we&apos;re not for everyone
            but those that do will love it.
          </p>
        </div>
        <div className="w-full h-full overflow-visible flex flex-col gap-8 px-4 md:px-0">
          <div
            style={{
              backgroundImage: "url(./images/dashboard.png)",
            }}
            className="w-full min-h-[880px] flex flex-col items-start justify-start rounded-3xl overflow-hidden shadow-2xl glass"
          >
            <div className="w-full px-4 py-4 flex flex-row gap-2 items-center border-b border-white/10">
              <div className="size-3 rounded-full bg-red-500/50"></div>
              <div className="size-3 rounded-full bg-yellow-500/50"></div>
              <div className="size-3 rounded-full bg-green-500/50"></div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AIIntegration;
