import { FC, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { GetStaticProps } from "next";
import { motion, useInView } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { FEATURES } from "@/lib/features";
import { GitHubCommit } from "@/lib/github-api";
import { ROUTES } from "@/lib/router";
import { FeatureCard } from "@/components/pages/FeatureCard";
import RecentCommits from "@/components/ui/RecentCommits";
import SEOHead from "@/components/seo/SEOHead";
import {
  generateSoftwareApplicationStructuredData,
  generateWebsiteStructuredData,
  generateOrganizationStructuredData,
} from "@/lib/json-ld-schemas";

interface HomeProps {
  commits: GitHubCommit[];
}

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

const AnimatedSection: FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={reveal}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const HomePage: FC<HomeProps> = ({ commits }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const primaryHref =
    isLoggedIn && user ? ROUTES.USER_PROFILE(user.id) : ROUTES.REGISTER;

  const websiteStructuredData = generateWebsiteStructuredData({
    name: "CodeRacer",
    url: "https://coderacer.codes",
    description:
      "Real-time coding competition platform for improving programming skills through fun, competitive challenges.",
  });

  const softwareAppStructuredData = generateSoftwareApplicationStructuredData({
    "@type": "SoftwareApplication",
    name: "CodeRacer",
    description:
      "Real-time coding competition platform where developers can improve their programming skills through competitive coding challenges.",
    url: "https://coderacer.codes",
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  });
  const organizationStructuredData = generateOrganizationStructuredData();

  return (
    <>
      <SEOHead
        title="CodeRacer - Real-Time Algorithm Coding Races"
        description="Race developers in real time, solve algorithm challenges, and improve your competitive programming skills with instant judging."
        keywords="CodeRacer, coding race, real-time coding competition, algorithm practice, competitive programming"
        image="/code_racer_hero2.webp"
        structuredData={[
          organizationStructuredData,
          websiteStructuredData,
          softwareAppStructuredData,
        ]}
      />

      <div className="relative isolate overflow-hidden bg-[#080a0d] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-18rem] top-24 -z-10 h-[38rem] w-[38rem] rounded-full bg-cyan-500/10 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-15rem] top-20 -z-10 h-[42rem] w-[42rem] rounded-full bg-violet-600/15 blur-[130px]"
        />

        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-20">
          <motion.div initial="hidden" animate="visible" variants={reveal}>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
              <span className="mb-5 block text-sm font-bold uppercase tracking-[0.22em] text-cyan-400 sm:text-base">
                CodeRacer — real-time algorithm races
              </span>
              Think fast.
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                Code faster.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base font-normal leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Go head-to-head on algorithm challenges, submit before your
              opponent, and turn every match into measurable progress.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-slate-950 shadow-[0_12px_40px_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                {isLoggedIn ? "Enter the arena" : "Start racing free"}
              </Link>
              <Link
                href="https://github.com/Dongmoon29/code_racer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                View on GitHub
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-400">
              <span>Free to play</span>
              <span>Instant judging</span>
              <span>3 languages</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="relative mx-auto aspect-square w-full max-w-[580px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-[12%] rounded-full bg-gradient-to-br from-orange-400/20 via-pink-500/20 to-violet-600/25 blur-3xl"
            />
            <Image
              src="/code_racer_hero2.webp"
              alt="CodeRacer robot driving a race car"
              fill
              priority
              className="object-contain drop-shadow-[0_35px_60px_rgba(124,58,237,0.22)]"
              sizes="(max-width: 1024px) 90vw, 580px"
            />
          </motion.div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.025]">
          <div className="mx-auto grid max-w-7xl divide-y divide-white/[0.07] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-10">
            {[
              {
                title: "Live synchronization",
                description: "See the race unfold as it happens",
              },
              {
                title: "Isolated evaluation",
                description: "Run every solution against judge cases",
              },
              {
                title: "Competitive rating",
                description: "Track progress with every ranked match",
              },
            ].map(({ title, description }) => (
              <div key={title} className="px-3 py-7 sm:px-7">
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-xs font-normal text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <AnimatedSection className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-5xl">
                From ready to ranked in three moves.
              </h2>
            </div>
            <p className="max-w-2xl text-base font-normal leading-7 text-slate-400 lg:justify-self-end">
              Pick your difficulty, enter the arena, and submit a passing
              solution before the other racer. No setup, no ceremony—just code.
            </p>
          </AnimatedSection>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Choose your race",
                description:
                  "Practice solo or challenge another developer in a live match.",
              },
              {
                number: "02",
                title: "Solve under pressure",
                description:
                  "Write in JavaScript, Python, or Go while the clock keeps moving.",
              },
              {
                number: "03",
                title: "Claim the finish",
                description:
                  "Pass every judge case first and watch your competitive record grow.",
              },
            ].map(({ number, title, description }, index) => (
              <AnimatedSection
                key={number}
                delay={index * 0.08}
                className="h-full"
              >
                <article className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-white/[0.055]">
                  <span className="font-mono text-xs font-bold text-slate-600">
                    {number}
                  </span>
                  <h3 className="mt-10 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm font-normal leading-6 text-slate-400">
                    {description}
                  </p>
                </article>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#0b0e12]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-28">
            <AnimatedSection className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-5xl">
                Everything you need to race better.
              </h2>
              <p className="mt-5 text-base font-normal leading-7 text-slate-400">
                Focused tools for fast feedback, fair competition, and
                consistent practice.
              </p>
            </AnimatedSection>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <AnimatedSection
                  key={feature.id}
                  delay={index * 0.05}
                  className="h-full"
                >
                  <FeatureCard
                    title={feature.title}
                    description={feature.description}
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {commits.length > 0 ? (
          <section className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10 lg:py-28">
            <AnimatedSection>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                Built in public
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Always moving forward.
              </h2>
              <p className="mt-5 max-w-md text-sm font-normal leading-7 text-slate-400">
                CodeRacer is open source and actively evolving. Follow the
                latest improvements or help shape the next release.
              </p>
              <Link
                href="https://github.com/Dongmoon29/code_racer"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex text-sm font-bold text-white transition hover:text-cyan-300"
              >
                Explore the repository
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.08}>
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                <RecentCommits
                  commits={commits}
                  className="!border-0 !bg-transparent !shadow-none"
                  showIcons={false}
                />
              </div>
            </AnimatedSection>
          </section>
        ) : null}

        <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <AnimatedSection className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.11] via-white/[0.04] to-violet-500/[0.13] px-6 py-14 text-center sm:px-10 sm:py-18">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 -z-10 h-48 w-96 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"
            />
            <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-5xl">
              Your next rival is waiting.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm font-normal leading-7 text-slate-300 sm:text-base">
              Join the arena, choose a challenge, and find out how fast you
              really think.
            </p>
            <Link
              href={primaryHref}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              {isLoggedIn ? "Race now" : "Create your account"}
            </Link>
          </AnimatedSection>
        </section>
      </div>
    </>
  );
};

export default HomePage;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const commitsResponse = await fetch(
      "https://api.github.com/repos/Dongmoon29/code_racer/commits?per_page=5",
      { headers: { Accept: "application/vnd.github.v3+json" } },
    );
    const commits = commitsResponse.ok ? await commitsResponse.json() : [];
    return { props: { commits }, revalidate: 3600 };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch commits:", error);
    }
    return { props: { commits: [] }, revalidate: 300 };
  }
};
