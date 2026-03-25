"use client";

import { useEffect, useState } from "react";
import styles from "./marketing.module.css";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Logo } from "@/components/common/Logo";

/* ─── Static data ─── */
const CARDS = [
  { type: "Task", color: "#eab308", label: "Fix onboarding flow", tag: "In Progress", top: "15%", left: "10%", rotate: -6, delay: 0 },
  { type: "Note", color: "#10b981", label: "3am idea: infinite canvas", top: "12%", left: "65%", rotate: 4, delay: 0.2 },
  { type: "List", color: "#a855f7", label: "Sprint Checklist", items: ["Design review", "API integration", "Deploy"], top: "60%", left: "70%", rotate: -3, delay: 0.4 },
  { type: "Flow", color: "#3b82f6", label: "User Onboarding Flow", top: "65%", left: "8%", rotate: 2, delay: 0.6 },
  { type: "Mind", color: "#ec4899", label: "Q2 Strategy", top: "35%", left: "45%", rotate: -2, delay: 0.8 },
];

const FEATURES = [
  { emoji: "📝", title: "Task Cards", color: "#eab308", desc: "Statuses, priorities, and due dates — all visible at a glance on your canvas.", tag: "Organize" },
  { emoji: "🗒️", title: "Note Cards", color: "#10b981", desc: "Freeform capture for thoughts, links, and context. No folders, no friction.", tag: "Capture" },
  { emoji: "✅", title: "List Cards", color: "#a855f7", desc: "Inline checklists with sub-items. Completion tracking built right in.", tag: "Track" },
  { emoji: "🔀", title: "User Flows", color: "#3b82f6", desc: "Connect cards with edges to map out product flows and system architectures.", tag: "Map" },
  { emoji: "🧠", title: "Mind Maps", color: "#ec4899", desc: "Branch ideas radially outward. Visual thinking the way your brain actually works.", tag: "Think" },
  { emoji: "🎭", title: "Stickers", color: "#f97316", desc: "Expressive character stickers to add personality and visual hierarchy.", tag: "Delight" },
];

const PERSONAS = [
  { icon: "🎨", role: "Designers", desc: "Wireframe, annotate, and think spatially — no more tab-switching" },
  { icon: "🧑‍💻", role: "Developers", desc: "Architecture diagrams next to your task list. Context never lost" },
  { icon: "📋", role: "Product Managers", desc: "Sprint boards, stakeholder flows, and retros on one canvas" },
  { icon: "✍️", role: "Writers", desc: "Brainstorm, outline, and draft in one connected space" },
];

const CHANGELOG = [
  { version: "v0.4", date: "Mar 2026", title: "Gesture Engine v2", desc: "Real-time hand tracking with point, peace, and pinch gestures. Control your canvas hands-free." },
  { version: "v0.3", date: "Feb 2026", title: "User Flows & Mind Maps", desc: "Connect any card to any other. Build flows, map systems, and visualise ideas spatially." },
  { version: "v0.2", date: "Jan 2026", title: "Real-time Cloud Sync", desc: "All canvases and cards sync instantly to Firestore. Pick up exactly where you left off." },
];

/* ─── Animation Variants ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const FloatingCard = ({ card }: { card: typeof CARDS[0] }) => {
  return (
    <motion.div
      className={styles.floatingCard}
      initial={{ opacity: 0, y: 50, scale: 0.9, rotate: card.rotate - 10 }}
      animate={{ 
        opacity: 1, 
        y: [0, -15, 0], 
        scale: 1, 
        rotate: card.rotate 
      }}
      transition={{ 
        opacity: { duration: 0.8, delay: card.delay },
        scale: { duration: 0.8, delay: card.delay, type: "spring", stiffness: 100 },
        rotate: { duration: 0.8, delay: card.delay, type: "spring" },
        y: { duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: card.delay }
      }}
      style={{
        top: card.top,
        left: card.left,
        borderColor: card.color + "40",
        boxShadow: `0 20px 40px ${card.color}15, 0 1px 3px rgba(0,0,0,0.05)`,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className={styles.cardHeader} style={{ background: card.color + "15" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: card.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{card.type}</span>
        {card.tag && <span style={{ fontSize: 9, background: card.color, color: "#fff", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>{card.tag}</span>}
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.4, letterSpacing: "-0.01em" }}>{card.label}</p>
      {card.items && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          {card.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#4b5563" }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, border: `1.5px solid ${card.color}`, flexShrink: 0, background: i === 0 ? card.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i === 0 && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span style={{ textDecoration: i === 0 ? "line-through" : "none", opacity: i === 0 ? 0.5 : 1 }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ─── Main Page ─── */
export default function MarketingHome() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.root}>
      {/* ───────────────── NAV ───────────────── */}
      <motion.nav 
        className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <Logo size={32} />
            <span className={styles.logoText}>AirTasks</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#vision" className={styles.navLink}>Vision</a>
            <a href="#changelog" className={styles.navLink}>Changelog</a>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.btnGhost}>Log In</Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/workspace" className={styles.btnPrimary}>Start Free</Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ───────────────── HERO ───────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />

        <div className={styles.floatingCardsLayer}>
          {CARDS.map((card, i) => <FloatingCard key={i} card={card} />)}
        </div>

        <motion.div 
          className={styles.heroContent}
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={styles.heroPill}
          >
            <span className={styles.heroPillDot} />
            Introducing Gesture Control v2
          </motion.div>
          
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as any }}
          >
            Think without<br />
            <span className={styles.heroTitleGradient}>boundaries.</span>
          </motion.h1>
          
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
          >
            The infinite canvas where tasks, notes, mind maps, and flows converge. Control it flawlessly with your voice, hands, or keyboard.
          </motion.p>
          
          <motion.div 
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/workspace" className={styles.btnLg}>
                Open Workspace
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ───────────────── MARQUEE ───────────────── */}
      <div className={styles.marqueeContainer}>
        <motion.div 
          className={styles.marqueeTrack}
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {["spatial thinking", "gesture control", "voice commands", "infinite canvas", "multi-workspace", "real-time sync"].map((item, i) => (
            <div key={i} className={styles.marqueeItem}>
              <span>{item}</span>
              <div className={styles.marqueeSeparator} />
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {["spatial thinking", "gesture control", "voice commands", "infinite canvas", "multi-workspace", "real-time sync"].map((item, i) => (
            <div key={`dup-${i}`} className={styles.marqueeItem}>
              <span>{item}</span>
              <div className={styles.marqueeSeparator} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* ───────────────── FEATURES ───────────────── */}
      <section id="features" className={styles.featuresSection}>
        <motion.div 
          className={styles.sectionHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className={styles.sectionEyebrow}>Capabilities</div>
          <h2 className={styles.sectionTitle}>Everything, everywhere,<br />all on one canvas.</h2>
        </motion.div>

        <motion.div 
          className={styles.featuresGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {FEATURES.map((f, i) => (
            <motion.div 
              key={i} 
              className={styles.featureCard}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className={styles.featureIcon} style={{ background: f.color + "15", color: f.color }}>
                {f.emoji}
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────── INNOVATION (Gesture/Voice) ───────────────── */}
      <section id="vision" className={styles.innovationSection}>
        <div className={styles.innovationContainer}>
          <motion.div 
            className={styles.innovationContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className={styles.sectionEyebrow} style={{ color: "rgba(255,255,255,0.7)" }}>The Future of Interaction</motion.div>
            <motion.h2 variants={fadeInUp} className={styles.sectionTitle} style={{ color: "#fff" }}>
              Your hands are<br />the interface.
            </motion.h2>
            <motion.p variants={fadeInUp} className={styles.innovationDesc}>
              AirTasks tracks your gestures in real-time. Point to select cards, pinch to zoom across your infinite canvas, and throw a peace sign ✌️ to magically switch workspaces.
            </motion.p>
            <motion.div variants={fadeInUp} className={styles.chipRow}>
              {["Point to interact", "Peace to switch", "Pinch to navigate", "Speak to create"].map((chip, i) => (
                <div key={i} className={styles.glassChip}>{chip}</div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.innovationVisual}
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.glassCard}>
              <motion.div 
                className={styles.handTracker}
                animate={{ x: [-20, 20, -10, 15, -20], y: [-10, 15, 20, -10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className={styles.trackingDot} />
                <div className={styles.trackingRing} />
                <span className={styles.handEmoji}>✋</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────────── PERSONAS ───────────────── */}
      <section className={styles.personasSection}>
        <motion.div 
          className={styles.sectionHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className={styles.sectionEyebrow}>For Creators</div>
          <h2 className={styles.sectionTitle}>Built for minds that<br />refuse to be boxed in.</h2>
        </motion.div>

        <motion.div 
          className={styles.personasGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PERSONAS.map((p, i) => (
            <motion.div key={i} className={styles.personaCard} variants={fadeInUp} whileHover={{ scale: 1.02 }}>
              <div className={styles.personaIcon}>{p.icon}</div>
              <h3 className={styles.personaRole}>{p.role}</h3>
              <p className={styles.personaDesc}>{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────── CHANGELOG ───────────────── */}
      <section id="changelog" className={styles.changelogSection}>
        <motion.div 
          className={styles.changelogHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className={styles.sectionTitle}>Relentless progress.</h2>
        </motion.div>

        <div className={styles.changelogList}>
          {CHANGELOG.map((item, i) => (
            <motion.div 
              key={i} 
              className={styles.changelogItem}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className={styles.changelogMeta}>
                <span className={styles.changelogVersion}>{item.version}</span>
                <span className={styles.changelogDate}>{item.date}</span>
              </div>
              <div className={styles.changelogBody}>
                <h3 className={styles.changelogTitle}>{item.title}</h3>
                <p className={styles.changelogDesc}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────────────── CTA ───────────────── */}
      <section className={styles.ctaSection}>
        <motion.div 
          className={styles.ctaCard}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className={styles.ctaTitle}>Ready to map<br />your thoughts?</h2>
          <p className={styles.ctaDesc}>Join brilliant teams and independent thinkers who are building the future on AirTasks.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/workspace" className={styles.btnLgPrimary}>
              Get Started for Free
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <Logo size={24} />
            <span className={styles.logoText} style={{ fontSize: 16 }}>AirTasks</span>
          </div>
          <p className={styles.footerCopy}>© 2026 AirTasks Inc. Designed with intent.</p>
        </div>
      </footer>
    </div>
  );
}
