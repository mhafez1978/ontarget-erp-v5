"use client";

import React from "react";

const BlockchainCTA: React.FC = () => {
  return (
    <section
      id="blockchain"
      className="bg-background/30 dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl pt-8 md:pt-16"
    >
      <div className="section-content flex flex-col items-center">
        <h3 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-black dark:dark:text-gray-200">
          Immutable by Design.
          <br />
          <span className="text-purple-500 dark:text-primary italic">
            Trusted by Enterprise.
          </span>
        </h3>

        <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto mb-12">
          Securing the future of global commerce with un-alterable,
          cryptographically-proven records.
        </p>
      </div>
    </section>
  );
};
export default BlockchainCTA;
