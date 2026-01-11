// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Globe2, Users, Shield, BarChart3 } from "lucide-react";

// export function PowerfulFeaturesSection() {
//   return (
//     <section
//       id="features"
//       className="px-3 md:lg:xl:px-40 border-t border-b py-20 bg-opacity-10"
//       style={{
//         backgroundImage:
//           "url('https://www.toptal.com/designers/subtlepatterns/uploads/dot-grid.png')",
//       }}
//     >
//       <div className="container mx-auto">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
//             Powerful Features for Your Business
//           </h2>
//           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//             Everything you need to manage and grow your enterprise efficiently
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:lg:xl:grid-cols-3 group bg-white shadow-xl shadow-neutral-100 border">
//           {/* Storefront Builder */}
//           <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r md:lg:xl:border-b hover:bg-slate-50 cursor-pointer transition-colors">
//             <span className="p-5 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-200">
//               <Globe2 className="h-10 w-10" />
//             </span>
//             <p className="text-xl font-medium text-slate-700 mt-3">
//               Professional Storefront Builder
//             </p>
//             <p className="mt-2 text-sm text-slate-500">
//               Create stunning online stores with 8+ seasonal themes. Sell
//               products & services with integrated payment processing.
//             </p>
//           </div>

//           {/* Workforce Management */}
//           <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r md:lg:xl:border-b hover:bg-slate-50 cursor-pointer transition-colors">
//             <span className="p-5 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-200">
//               <Users className="h-10 w-10" />
//             </span>
//             <p className="text-xl font-medium text-slate-700 mt-3">
//               Complete Workforce Management
//             </p>
//             <p className="mt-2 text-sm text-slate-500">
//               Manage staff, contractors, field techs with role-based access.
//               Track hiring, performance, and team collaboration.
//             </p>
//           </div>

//           {/* Customer Portal */}
//           <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-b hover:bg-slate-50 cursor-pointer transition-colors">
//             <span className="p-5 rounded-full bg-green-500 text-white shadow-lg shadow-green-200">
//               <Shield className="h-10 w-10" />
//             </span>
//             <p className="text-xl font-medium text-slate-700 mt-3">
//               Secure Customer Portal
//             </p>
//             <p className="mt-2 text-sm text-slate-500">
//               OAuth authentication, customer accounts, order tracking, and
//               personalized experiences with encryption.
//             </p>
//           </div>

//           {/* Project Management */}
//           <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r hover:bg-slate-50 cursor-pointer transition-colors">
//             <span className="p-5 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-200">
//               <BarChart3 className="h-10 w-10" />
//             </span>
//             <p className="text-xl font-medium text-slate-700 mt-3">
//               Project & Task Management
//             </p>
//             <p className="mt-2 text-sm text-slate-500">
//               Kanban boards, task assignments, deadlines, and progress tracking
//               for complete project oversight.
//             </p>
//           </div>

//           {/* Payment Processing */}
//           <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r hover:bg-slate-50 cursor-pointer transition-colors">
//             <span className="p-5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-10 w-10"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//                 strokeWidth="1.5"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
//                 />
//               </svg>
//             </span>
//             <p className="text-xl font-medium text-slate-700 mt-3">
//               Integrated Payment Solutions
//             </p>
//             <p className="mt-2 text-sm text-slate-500">
//               Stripe integration, subscription billing, invoicing, and financial
//               ledger with automated tracking.
//             </p>
//           </div>

//           {/* File Management */}
//           <div className="p-10 flex flex-col items-center text-center group hover:bg-slate-50 cursor-pointer transition-colors">
//             <span className="p-5 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-200">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-10 w-10"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//                 strokeWidth="1.5"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
//                 />
//               </svg>
//             </span>
//             <p className="text-xl font-medium text-slate-700 mt-3">
//               Secure File Management
//             </p>
//             <p className="mt-2 text-sm text-slate-500">
//               Cloud storage with company folders, automatic backups, and secure
//               file sharing across teams.
//             </p>
//           </div>
//         </div>

//         {/* CTA Banner */}
//         <div className="w-full bg-indigo-600 shadow-xl shadow-indigo-200 py-10 px-20 flex flex-col md:flex-row justify-between items-center gap-6 mt-8 mb-20 rounded-lg">
//           <div className="text-white text-center md:text-left">
//             <span className="text-4xl font-medium block mb-2">
//               Ready to Get Started?
//             </span>
//             <span className="text-lg">
//               Start your 14-day free trial today – no credit card required!
//             </span>
//           </div>
//           <Link href="/register?plan=ESSENTIAL">
//             <Button
//               size="lg"
//               className="px-8 py-6 font-medium text-slate-700 shadow-xl duration-150 bg-yellow-400 hover:bg-yellow-300 text-lg"
//             >
//               START FREE TRIAL
//             </Button>
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Globe2,
  Users,
  Shield,
  BarChart3,
  CreditCard,
  FolderClosed,
} from "lucide-react";

export function PowerfulFeaturesSection() {
  return (
    <section className="relative overflow-hidden py-32 bg-linear-to-b from-slate-950 via-purple-950/50 to-slate-900 text-white">
      {/* Dramatic Spacey Smokey Background */}
      <div className="absolute inset-0 opacity-60">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://thumbs.dreamstime.com/b/swirling-purple-smoke-creating-abstract-cosmic-nebula-particles-flowing-cloud-featuring-pink-hues-illuminated-countless-417543571.jpg')",
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center animate-pulse slow"
          style={{
            backgroundImage:
              "url('https://thumbs.dreamstime.com/b/cosmic-nebula-galaxy-background-pink-blue-purple-stars-space-388187583.jpg')",
          }}
        />
      </div>

      {/* Subtle Floating Particles Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-ping slow" />
        <div className="absolute bottom-20 right-30 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-ping delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/10 rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        {/* Epic Heading - Apple-style Clean Typography + Material Elevation */}
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight bg-linear-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Powerful Features
            <br />
            for the Modern Enterprise
          </h2>
          <p className="mt-8 text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto opacity-90">
            AI-driven tools that scale with your ambition – secure, intuitive,
            and limitless.
          </p>
        </div>

        {/* Floating Glassmorphic Cards Grid - 3x2 with Subtle Movements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center text-center">
              <div className="p-6 bg-indigo-600/30 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <Globe2 className="h-16 w-16 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Professional Storefront Builder
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Create stunning online stores with 8+ seasonal themes. Sell
                products & services with integrated payment processing.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center text-center">
              <div className="p-6 bg-blue-600/30 rounded-2xl mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                <Users className="h-16 w-16 text-blue-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Complete Workforce Management
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Manage staff, contractors, field techs with role-based access.
                Track hiring, performance, and team collaboration.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-green-500/30 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-green-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center text-center">
              <div className="p-6 bg-green-600/30 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <Shield className="h-16 w-16 text-green-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Secure Customer Portal
              </h3>
              <p className="text-gray-300 leading-relaxed">
                OAuth authentication, customer accounts, order tracking, and
                personalized experiences with encryption.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center text-center">
              <div className="p-6 bg-purple-600/30 rounded-2xl mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                <BarChart3 className="h-16 w-16 text-purple-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Project & Task Management
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Kanban boards, task assignments, deadlines, and progress
                tracking for complete project oversight.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center text-center">
              <div className="p-6 bg-emerald-600/30 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <CreditCard className="h-16 w-16 text-emerald-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Integrated Payment Solutions
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Stripe integration, subscription billing, invoicing, and
                financial ledger with automated tracking.
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-orange-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center text-center">
              <div className="p-6 bg-orange-600/30 rounded-2xl mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                <FolderClosed className="h-16 w-16 text-orange-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Secure File Management
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Cloud storage with company folders, automatic backups, and
                secure file sharing across teams.
              </p>
            </div>
          </div>
        </div>

        {/* Dramatic CTA Banner - Elevated with Glow */}
        <div className="relative mt-24 bg-linear-to-r from-indigo-600/50 to-purple-600/50 backdrop-blur-2xl rounded-3xl p-12 shadow-2xl border border-white/20 overflow-hidden">
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div>
              <h3 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to Launch?
              </h3>
              <p className="text-xl text-gray-200">
                Start your 14-day free trial – no credit card required!
              </p>
            </div>
            <Link href="/register?plan=ESSENTIAL">
              <Button
                size="lg"
                className="px-12 py-8 text-2xl font-semibold bg-linear-to-r from-yellow-400 to-orange-400 text-slate-900 shadow-2xl hover:shadow-yellow-500/50 hover:scale-110 transition-all duration-300"
              >
                START FREE TRIAL
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
