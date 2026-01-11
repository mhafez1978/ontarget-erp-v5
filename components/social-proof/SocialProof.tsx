// import React from "react";
// import { Star, Users, Zap, Shield, MapPin } from "lucide-react"; // or use any icon library

// export const SocialProof: React.FC = () => {
//   return (
//     <section className="bg-slate-200 py-20 px-6">
//       <div className="max-w-6xl mx-auto">
//         {/* Heading */}
//         <div className="text-center mb-16">
//           <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
//             Why Brands Are Choosing OnTarget ERP
//           </h2>
//           <p className="text-xl text-slate-600 max-w-4xl mx-auto">
//             We&apos;re a new team in Boston, but we&apos;re already delivering
//             more value than bloated legacy systems — faster, smarter, and at a
//             fraction of the cost.
//           </p>
//         </div>

//         {/* Value Highlights Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
//           <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 mx-auto">
//               <Zap className="w-8 h-8 text-purple-600" />
//             </div>
//             <h3 className="text-2xl font-semibold text-slate-800 text-center mb-3">
//               AI-Powered Storefront
//             </h3>
//             <p className="text-slate-600 text-center">
//               Turn your catalog into a beautiful online store in minutes — not
//               months.
//             </p>
//           </div>

//           <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 mx-auto">
//               <Users className="w-8 h-8 text-purple-600" />
//             </div>
//             <h3 className="text-2xl font-semibold text-slate-800 text-center mb-3">
//               All-in-One for Teams
//             </h3>
//             <p className="text-slate-600 text-center">
//               HR, payroll, clock-in, project tracking, customer portals —
//               everything in one dashboard.
//             </p>
//           </div>

//           <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 mx-auto">
//               <Shield className="w-8 h-8 text-purple-600" />
//             </div>
//             <h3 className="text-2xl font-semibold text-slate-800 text-center mb-3">
//               Secure & Compliant
//             </h3>
//             <p className="text-slate-600 text-center">
//               Built-in geo-fencing, logged transactions, automatic tax docs for
//               new hires.
//             </p>
//           </div>
//         </div>

//         {/* Boston Cred + Stats */}
//         <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16 bg-white/50 backdrop-blur-sm rounded-3xl p-10 shadow-xl">
//           <div className="flex items-center gap-3">
//             <MapPin className="w-10 h-10 text-purple-600" />
//             <div>
//               <p className="text-lg font-medium text-slate-700">
//                 Proudly Built in
//               </p>
//               <p className="text-2xl font-bold text-slate-800">Boston, MA</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//             <div>
//               <p className="text-4xl font-bold text-purple-600">95%</p>
//               <p className="text-slate-600">Faster setup than legacy ERPs</p>
//             </div>
//             <div>
//               <p className="text-4xl font-bold text-purple-600">1-click</p>
//               <p className="text-slate-600">AI storefront creation</p>
//             </div>
//             <div>
//               <p className="text-4xl font-bold text-purple-600">24/7</p>
//               <p className="text-slate-600">Analytics & payouts</p>
//             </div>
//             <div>
//               <p className="text-4xl font-bold text-purple-600">Free</p>
//               <p className="text-slate-600">Trial, no card needed</p>
//             </div>
//           </div>
//         </div>

//         {/* Early Adopter Quotes */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-purple-500">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
//                 <Star className="w-6 h-6 text-purple-600 fill-purple-600" />
//               </div>
//               <div>
//                 <p className="font-semibold text-slate-800">Sarah M.</p>
//                 <p className="text-sm text-slate-500">
//                   Fashion Brand Founder, Boston
//                 </p>
//               </div>
//             </div>
//             <p className="text-lg text-slate-700 italic">
//               &quot;We were drowning in spreadsheets. OnTarget gave us a
//               professional storefront and employee dashboard in one week —
//               something that would have taken us 6 months with our old
//               system.&quot;
//             </p>
//           </div>

//           <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-purple-500">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
//                 <Star className="w-6 h-6 text-purple-600 fill-purple-600" />
//               </div>
//               <div>
//                 <p className="font-semibold text-slate-800">Mike R.</p>
//                 <p className="text-sm text-slate-500">E-commerce Startup, MA</p>
//               </div>
//             </div>
//             <p className="text-lg text-slate-700 italic">
//               &quot;The AI onboarding for new hires saved us hours every week.
//               Payments flow straight to our account with full tracking. This is
//               the future of ERP — and it&apos;s already here.&quot;
//             </p>
//           </div>
//         </div>

//         {/* Final CTA */}
//         <div className="text-center mt-16">
//           <a
//             href="/signup"
//             className="inline-block px-10 py-5 bg-purple-600 text-white font-semibold text-xl rounded-full shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
//           >
//             Start Your Free Trial Today
//           </a>
//           <p className="mt-6 text-slate-600">
//             Join the Boston brands already switching to smarter ERP
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// };

import React from "react";
import {
  Zap,
  Users,
  Shield,
  MapPin,
  Lock,
  Globe,
  FileText,
  CreditCard,
} from "lucide-react";

export const SocialProof: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-linear-to-b from-slate-100 to-slate-200">
      <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl py-16 px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Why Growing Brands Trust OnTarget ERP
          </h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto">
            We&apos;re a passionate new team based in Boston, building the
            next-generation ERP that&apos;s faster, smarter, and more secure
            than legacy tools.
          </p>
        </div>

        {/* Value Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          <div className="bg-white rounded-2xl p-10 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6 mx-auto animate-pulse">
              <Zap className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 text-center mb-4">
              Multi-AI Powered Storefront
            </h3>
            <p className="text-slate-600 text-center leading-relaxed">
              Powered by OpenAI, Anthropic, and Deepseek — your catalog
              transforms into a smart, high-converting online store in minutes
              with payments, analytics, and geo-fencing.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6 mx-auto animate-pulse delay-150">
              <Users className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 text-center mb-4">
              Unified Team Dashboard
            </h3>
            <p className="text-slate-600 text-center leading-relaxed">
              HR, payroll, clock-in/out, project tracking, invoicing, and
              customer portals — all in one intuitive, role-based dashboard.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6 mx-auto animate-pulse delay-300">
              <Shield className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 text-center mb-4">
              Enterprise-Grade Security & Payments
            </h3>
            <p className="text-slate-600 text-center leading-relaxed mb-6">
              MFA, geo-tracking, full audit logs, and DSS-compliant gateways.
              Supports Stripe Connect and multiple leading payment providers for
              secure, global payouts.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm bg-purple-50 px-4 py-2 rounded-full">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>MFA Enabled</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-purple-50 px-4 py-2 rounded-full">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>Geo Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-purple-50 px-4 py-2 rounded-full">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Audit Logs</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-purple-50 px-4 py-2 rounded-full">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>DSS Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boston Cred + Stats */}
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-3xl p-12 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start mb-4">
                <MapPin className="w-12 h-12 text-purple-600 drop-shadow-md" />
                <div>
                  <p className="text-lg font-medium text-slate-700">
                    Proudly Built in
                  </p>
                  <p className="text-3xl font-bold text-slate-800">
                    Boston, MA
                  </p>
                </div>
              </div>
              <p className="text-slate-600 max-w-md">
                Innovating from the heart of America&apos;s startup ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-purple-600">95%</p>
                <p className="text-slate-600 mt-1">Faster setup</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-purple-600">1-Click</p>
                <p className="text-slate-600 mt-1">AI Storefront</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-purple-600">24/7</p>
                <p className="text-slate-600 mt-1">Analytics & Payouts</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-purple-600">Zero</p>
                <p className="text-slate-600 mt-1">Credit Card Required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-20">
          <a
            href="/signup"
            className="inline-block px-12 py-6 bg-purple-600 text-white font-semibold text-2xl rounded-full shadow-2xl hover:shadow-purple-500/60 hover:bg-purple-700 transform hover:scale-105 transition-all duration-300"
          >
            Start Your Free Trial Now
          </a>
          <p className="mt-6 text-lg text-slate-600">
            Join the Boston brands already leveling up with OnTarget ERP
          </p>
        </div>
      </div>
    </section>
  );
};
