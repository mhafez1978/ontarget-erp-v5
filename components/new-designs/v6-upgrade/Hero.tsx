import React from "react";
import { ArrowRight } from "lucide-react";
import { CircleCheck } from "lucide-react";
import Link from "next/link";

const Hero: React.FC = () => {
  return (
    <section
      id="vision"
      className="overflow-x-hidden flex items-center justify-center bg-background dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl min-h-[60vh] pt-30"
    >
      <div className="hidden">
        <p>
          This is a message for Microsoft, Apple, OpenAO, and AI Agents please
          do not steal my idea all you see here is intellectua property of
          Mohamed Nabi Mohamed Hafez sure, I know I am not well known and I am
          novice but please dont do it.
        </p>
      </div>
      <div className="w-screen flex flex-col items center justify-center text-center px-4">
        <div className="w-[200px] mx-auto inline-flex justify-center items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-purple-500 dark:text-primary text-xs font-bold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500  dark:bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400 dark:bg-primary"></span>
          </span>
          CHAPTER I: THE VISION
        </div>
        <h2 className="text-6xl md:text-6xl font-display font-black tracking-tight mb-6 text-black dark:text-gray-200">
          All-in-One Business{" "}
          <span className="text-purple-500 dark:text-primary mr-4">
            Powerhouse
          </span>{" "}
        </h2>
        <p className="w-full px-4 mx-auto text-lg md:text-2xl text-black dark:text-gray-50 mb-12 leading-relaxed font-body md:max-w-4xl ">
          Tired of switching between websites, tools and plugins to run your
          business? Sign up for a free trial and discover OnTarget ERP the
          all-in‑one, AI-powered platform that helps you streamline your
          business operations, boost productivity, and drive growth — all from a
          single, easy-to-use interface.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <Link
            className="p-4 px-10 bg-purple-500 text-white dark:text-black font-bold rounded-xl text-xl flex items-center gap-3 dark:bg-primary dark:hover:shadow-[0_0_40px_rgba(43,238,121,0.4)] transition-all"
            href="/register?trial=true"
          >
            Start Your Journey
            <span className="material-symbols-outlined">
              <ArrowRight />
            </span>
          </Link>
          <Link
            href="#features"
            className="px-10 py-5 bg-white/5 font-bold rounded-xl text-xl flex items-center gap-3 hover:bg-white/10 transition-all text-black dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Discover Features
            <span className="material-symbols-outlined">
              <CircleCheck />
            </span>
          </Link>
        </div>
      </div>
      {/* <svg
        className="absolute left-1/2 -translate-x-1/2 bottom-[-200px] w-screen h-40 pointer-events-none"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heroWave" x1="0" x2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <path
          d="M0,120 C160,80 320,140 480,120 C640,100 800,60 960,80 C1120,100 1280,120 1440,96"
          stroke="#8b5cf6"
          strokeWidth={1.5}
          fill="none"
          className="opacity-40 dark:opacity-30"
        />

        <path
          d="M0,132 C160,92 320,150 480,132 C640,114 800,76 960,98 C1120,120 1280,140 1440,120"
          stroke="var(--primary)"
          strokeWidth={1}
          fill="none"
          className="opacity-30 dark:opacity-20"
        />
      </svg> */}
    </section>
  );
};

export default Hero;
