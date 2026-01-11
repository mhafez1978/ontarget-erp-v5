import React from "react";
import Link from "next/link";
import { Target } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="pt-24 pb-12 px-6 bg-background font-body">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-primary flex items-center justify-center rounded-lg text-background-dark">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold font-display">
                OnTarget ERP
              </span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Redefining the standard for modern business management with
              AI-first architecture and Blockchain security.
            </p>
          </div>
          {/* Add other link columns here similar to the HTML structure */}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-6">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} OnTarget ERP System Created By{" "}
            <Link
              href="https://blooming-brands.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blooming Brands Inc.
            </Link>{" "}
            All rights reserved.
          </p>
          <div className="flex items-center gap-2 group">
            <span className="text-text-muted text-sm">Created By</span>
            <span className="text-primary font-bold tracking-tight px-3 py-1 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all cursor-default">
              Mohamed Hafez
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
