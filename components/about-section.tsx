"use client";

import {
  Code2,
  Cloud,
  Award,
  Heart,
  Briefcase,
  GraduationCap,
} from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            About the Founder
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by a passionate technologist with decades of experience in
            enterprise solutions
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Bio */}
          <div className="space-y-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {/* <h3 className="text-2xl font-bold mb-4">Mohamed Hafez</h3> */}
              <p className="text-muted-foreground leading-relaxed">
                Mohamed Hafez a Full Stack Web Developer, Amazon Certified Cloud
                Practitioner, and Microsoft Certified Systems Engineer. When
                I&apos;m NOT coding, I&apos;m with Family.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With a unique blend of development expertise and enterprise
                architecture experience, I&apos;ve dedicated my career to
                building solutions that help businesses operate more
                efficiently. OnTarget Ai Driven ERP represents the culmination
                of years of experience working with diverse organizations and
                understanding their real-world challenges.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Based in Lowell, MA. I run Nodes Unlimited LLC, a next
                generation cloud web hosting service focusing on creating
                scalable, cloud-native applications that drive business
                transformation. I also, run Blooming Brands Inc - a full service
                online marketing and branding agency focuing on helping small
                business grow their online presence.
              </p>
            </div>

            {/* Company Info */}
            <div className="border-l-4 border-red-500 pl-6 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="font-semibold">Geeks On Demand LLC</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Charlotte, North Carolina
              </p>
            </div>
            <div className="border-l-4 border-amber-500 pl-6 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="font-semibold">Nodes Unlimited LLC</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lowell, Massachusetts
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-6 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="font-semibold">Blooming Brands Inc</span>{" "}
                &quot;OnTarget ERP&quot;
              </div>
              <p className="text-sm text-muted-foreground">
                Lowell, Massachusetts
              </p>
            </div>
          </div>

          {/* Right Column - Expertise Cards */}
          <div className="space-y-6">
            {/* Development Expertise */}
            <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Full Stack Development</h4>
                  <p className="text-sm text-muted-foreground">
                    Expert in modern web technologies including React, Next.js,
                    Node.js, TypeScript, and cloud-native architectures. Over 75
                    public repositories showcasing continuous learning and
                    innovation.
                  </p>
                </div>
              </div>
            </div>

            {/* Cloud Expertise */}
            <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Cloud className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Cloud & Infrastructure</h4>
                  <p className="text-sm text-muted-foreground">
                    Amazon Certified Cloud Practitioner with deep expertise in
                    AWS services, serverless architectures, and scalable cloud
                    solutions.
                  </p>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">
                    Certifications & Credentials
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Amazon Certified Cloud Practitioner
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Microsoft Certified Systems Engineer
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Philosophy */}
            <div className="rounded-lg border bg-linear-to-br from-primary/5 to-primary/10 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Development Philosophy</h4>
                  <p className="text-sm text-muted-foreground italic">
                    &quot;Technology should empower businesses, not complicate
                    them. Every feature in OnTarget ERP is designed with
                    real-world business needs in mind, backed by years of
                    hands-on experience and continuous innovation.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="text-3xl font-bold text-primary mb-2">75+</div>
            <div className="text-sm text-muted-foreground">
              Open Source Projects
            </div>
          </div>
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="text-3xl font-bold text-primary mb-2">38</div>
            <div className="text-sm text-muted-foreground">
              GitHub Followers
            </div>
          </div>
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="text-3xl font-bold text-primary mb-2">20+</div>
            <div className="text-sm text-muted-foreground">
              Years Experience
            </div>
          </div>
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Passion Driven</div>
          </div>
        </div>
      </div>
    </section>
  );
}
