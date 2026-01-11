import React from "react";
import { Target } from "lucide-react";
import Link from "next/link";

const Navbar: React.FC = () => {
  const navLinks = [
    { id: 1, name: "I. Vision", href: "#hero", primary: true },
    { id: 2, name: "II. Capabilities", href: "#features" },
    { id: 3, name: "III. AI", href: "#ai-integration" },
    { id: 4, name: "IV. Trust", href: "#security" },
    { id: 5, name: "V. Integrity", href: "#blockchain" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 glass">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary flex items-center justify-center rounded-lg text-background-dark">
            <Target className="font-bold w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-none font-display">
              OnTarget ERP
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              v5.0 Enterprise
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, id) => (
            <Link
              key={id}
              href={link.href}
              className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                link.primary
                  ? "text-primary hover:brightness-110"
                  : "hover:text-primary"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="px-5 py-2 text-sm font-bold border border-primary/20 hover:bg-primary/10 rounded-lg transition-all">
            Login
          </button>
          <button className="px-5 py-2 text-sm font-bold bg-primary text-background-dark rounded-lg hover:shadow-[0_0_20px_rgba(43,238,121,0.4)] transition-all">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
