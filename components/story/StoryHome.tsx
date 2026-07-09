"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMode } from "@/components/entry/ModeProvider";
import { Hero } from "./Hero";
import { ProjectIndex } from "./ProjectIndex";
import { Reveal } from "./Reveal";
import { StoryToolkit } from "./StoryToolkit";
import { SkillConstellation } from "./SkillConstellation";
import { StoryTimeline } from "./StoryTimeline";
import { StillWriting } from "./StillWriting";
import CountUp from "@/components/anim/CountUp";
import ShinyText from "@/components/anim/ShinyText";
import ScrollReveal from "@/components/anim/ScrollReveal";
import GradientText from "@/components/anim/GradientText";
import TextPressure from "@/components/anim/TextPressure";
import {
  profile,
  projects,
  experience,
  education,
  certifications,
  achievements,
  responsibilities,
  stats,
  marquee,
} from "@/content/content";
import {
  loadMemory,
  markSectionViewed,
  recordLastProject,
  isComplete,
  type Memory,
} from "@/lib/memory";

export default function StoryHome() {
  const { setMode } = useMode();
  const [mem, setMem] = useState<Memory>(() => loadMemory());
  const [showConstellation, setShowConstellation] = useState(false);

  // Quietly track which sections have been read (mission, Story-style).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute("data-section");
            if (section) setMem(markSectionViewed(section));
          }
        }
      },
      { threshold: 0.35 },
    );
    document
      .querySelectorAll<HTMLElement>("[data-section]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const anthropicCerts = certifications.filter((c) => c.group === "anthropic");
  const otherCerts = certifications.filter((c) => c.group === "other");
  const complete = isComplete(mem);

  return (
    <main
      style={{ background: "var(--story-bg)", color: "var(--story-ink)" }}
      className="relative min-h-dvh"
    >
      <div className="relative z-10">
        <Hero />

        <div className="mx-auto max-w-3xl px-6 pb-32">
        {/* About, the whole section reveals word-by-word as it scrolls in.
            No block-level rotation: rotating a whole multi-line paragraph as
            one rigid unit visibly shears the lines apart against each other,
            which read as "breaking" while scrolling past it. */}
        <section id="about" data-section="whoami" className="border-t pb-16 pt-8" style={{ borderColor: "var(--story-line)" }}>
          {/* <div className="mb-4 select-none py-1 text-[clamp(3rem,8.5vw,5.5rem)] leading-none" style={{ color: "var(--story-ink)" }}>
            <TextPressure
              text="Adhnan Jeff"
              flex
              reveal
              minFontSize={44}
              minWeight={420}
              maxWeight={900}
              minWidth={82}
              maxWidth={151}
              maxScale={1.12}
              textColor="var(--story-ink)"
            />
          </div> */}
          <SectionLabel>Who I am</SectionLabel>
          <div
            className="max-w-2xl text-2xl leading-snug sm:text-3xl"
            style={{ fontFamily: "var(--font-display), serif", fontWeight: 400 }}
          >
            <ScrollReveal baseRotation={0} blurStrength={7}>
              {"I gravitate to the parts of a system that aren't allowed to fail quietly, ledgers, pipelines, the API two teams depend on."}
            </ScrollReveal>
          </div>
          <div className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: "var(--story-muted)" }}>
            <ScrollReveal baseOpacity={0.2} baseRotation={0} blurStrength={4}>
              {"Right now I'm an Associate Software Engineer at eProductivity Software, converted from intern in July 2026, finishing my B.Tech in Information Technology, and building side projects to keep learning where real systems break."}
            </ScrollReveal>
          </div>
        </section>

        {/* Work */}
        <section id="work" data-section="builds" className="pt-16">
          <Reveal>
            <SectionLabel>Selected work</SectionLabel>
            <h2
              className="mb-2 text-3xl sm:text-4xl"
              style={{ fontFamily: "var(--font-display), serif", fontWeight: 500 }}
            >
              A few things I&apos;ve built.
            </h2>
            <p className="mb-4 max-w-xl text-lg" style={{ color: "var(--story-muted)" }}>
              Depth over a long list. Each of these taught me something the last
              one didn&apos;t.
            </p>
          </Reveal>
          <ProjectIndex
            projects={projects}
            onHoverProject={(id) => setMem(recordLastProject(id))}
          />
        </section>

        {/* Arsenal */}
        <section id="skills" data-section="arsenal" className="border-t py-16" style={{ borderColor: "var(--story-line)" }}>
          <Reveal>
            <div className="mb-6">
              <SectionLabel>The toolkit</SectionLabel>
              <p
                className="text-xl italic"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                <GradientText
                  colors={["var(--story-accent)", "#b45cd6", "var(--story-accent)"]}
                  animationSpeed={5}
                >
                  {profile.motto}
                </GradientText>
              </p>
            </div>
            <StoryToolkit />
            <button
              type="button"
              onClick={() => setShowConstellation(true)}
              className="press mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{
                color: "var(--story-accent)",
                border: "1px solid color-mix(in oklab, var(--story-accent) 45%, transparent)",
                background: "color-mix(in oklab, var(--story-accent) 8%, #fff)",
              }}
            >
              <ShinyText text="✦ See it as a constellation" speed={4} />
            </button>
          </Reveal>
        </section>

        {/* Path */}
        <section id="path" data-section="timeline" className="border-t py-16" style={{ borderColor: "var(--story-line)" }}>
          <Reveal>
            <SectionLabel>The path so far</SectionLabel>
            <StoryTimeline
              entries={[
                ...experience.map((e) => ({
                  period: e.period,
                  title: `${e.role} · ${e.company}`,
                  place: e.place,
                  body: e.descStory,
                })),
                {
                  period: education.period,
                  title: education.degree,
                  place: `${education.school}, ${education.place}`,
                },
              ]}
            />
            {/* by the numbers, counts up as it scrolls in */}
            <div
              className="mt-12 grid grid-cols-3 gap-4 border-y py-8"
              style={{ borderColor: "var(--story-line)" }}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <div
                    className="text-[clamp(1.8rem,5vw,3rem)] leading-none"
                    style={{ fontFamily: "var(--font-display), serif", fontWeight: 500, color: "var(--story-ink)" }}
                  >
                    <CountUp to={s.value} suffix={s.suffix} separator={s.separator} />
                  </div>
                  <div className="mt-2 text-xs sm:text-sm" style={{ color: "var(--story-muted)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Leadership</h4>
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                >
                  {responsibilities.map((r) => (
                    <motion.div
                      key={r.org}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
                      }}
                    >
                      <div className="text-sm font-medium">{r.org}</div>
                      <div className="text-sm" style={{ color: "var(--story-muted)" }}>
                        {r.roles.map((role) => `${role.role} (${role.period})`).join(" · ")}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Highlights</h4>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((a) => {
                    const shiny = a.includes(marquee);
                    return (
                      <span
                        key={a}
                        className="rounded-full px-3 py-1 text-sm"
                        style={{
                          color: shiny ? "var(--story-accent)" : "var(--story-muted)",
                          border: `1px solid ${shiny ? "color-mix(in oklab, var(--story-accent) 45%, transparent)" : "var(--story-line)"}`,
                        }}
                      >
                        {shiny ? <ShinyText text={a} speed={4} /> : a}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Certificates, Claude Code highlight */}
        <section id="certs" className="border-t py-16" style={{ borderColor: "var(--story-line)" }}>
          <Reveal>
            <SectionLabel>Recently learned</SectionLabel>
            <h2
              className="mb-6 text-2xl sm:text-3xl"
              style={{ fontFamily: "var(--font-display), serif", fontWeight: 500 }}
            >
              Certified on Claude Code, and more.
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {anthropicCerts.map((c) => (
                <div
                  key={c.name}
                  className="hover-lift rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid var(--story-line)" }}
                >
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs" style={{ color: "var(--story-accent)" }}>{c.issuer}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: "var(--story-muted)" }}>
              {otherCerts.map((c) => (
                <span key={c.name}>
                  {c.name}
                  {c.detail ? ` (${c.detail})` : ""}, {c.issuer}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        <StillWriting />

        {/* Contact + crossover close */}
        <section className="border-t py-20 text-center" style={{ borderColor: "var(--story-line)" }}>
          <Reveal>
            {complete && (
              <p className="mb-4 text-sm" style={{ color: "var(--story-accent)" }}>
                You&apos;ve read the whole thing, here&apos;s the résumé to keep.
              </p>
            )}
            <h2
              className="text-3xl sm:text-4xl"
              style={{ fontFamily: "var(--font-display), serif", fontWeight: 500 }}
            >
              Let&apos;s talk.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <a
                href={`mailto:${profile.links.email}`}
                className="press rounded-full px-5 py-2 font-medium"
                style={{ background: "var(--story-accent)", color: "#fff" }}
              >
                Email me
              </a>
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline" style={{ color: "var(--story-ink)" }}>
                GitHub
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline" style={{ color: "var(--story-ink)" }}>
                LinkedIn
              </a>
              <a href={profile.links.resume} download className="underline-offset-4 hover:underline" style={{ color: "var(--story-ink)" }}>
                Résumé
              </a>
            </div>

            <div className="mt-16 border-t pt-8" style={{ borderColor: "var(--story-line)" }}>
              <p style={{ color: "var(--story-muted)" }}>Curious how any of this actually works?</p>
              <button
                type="button"
                onClick={() => setMode("engineer")}
                className="mt-2 text-lg font-medium underline-offset-4 hover:underline"
                style={{ color: "var(--story-accent)" }}
              >
                → Enter Engineer Mode
              </button>
            </div>
          </Reveal>
        </section>
        </div>
      </div>

      <AnimatePresence>
        {showConstellation && (
          <SkillConstellation key="constellation" onClose={() => setShowConstellation(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs uppercase tracking-[0.25em]" style={{ color: "var(--story-accent)" }}>
      {children}
    </p>
  );
}
