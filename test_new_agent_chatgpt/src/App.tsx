import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CirclePlus,
  Eye,
  Fingerprint,
  FlaskConical,
  Layers3,
  Menu,
  Monitor,
  MoveUpRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { Brand, PulseMark } from "./Brand";
import ProductDemo from "./ProductDemo";
import SignalField from "./SignalField";
import Dialogs from "./Dialogs";
import type { DialogKind } from "./Dialogs";

const questions = [
  {
    q: "What is PulseMind?",
    a: "PulseMind is a proof-of-concept clinical decision-support dashboard for adult mechanically ventilated ICU patients. It explores how respiratory information, trends, contributing variables, and data limitations can be brought into a clearer view for clinicians.",
  },
  {
    q: "Is PulseMind being used for clinical care?",
    a: "Not yet. The current prototype uses simulated or file-based data and is not connected to live hospital systems. Its assessments are illustrative and have not been clinically validated. The next steps are to agree a clinical prediction target and horizon, establish a suitable retrospective dataset, and validate against a defined protocol.",
  },
  {
    q: "Does it replace clinical judgment or device alarms?",
    a: "No. PulseMind is designed for read-only decision support. It does not diagnose, recommend treatments, adjust ventilators, or replace existing device alarms. Bedside observation, clinical judgment, and all decisions remain with the care team.",
  },
  {
    q: "Who can help shape the next stage?",
    a: "ICU clinicians, clinical researchers, and hospital teams with an interest in adult respiratory care can contribute to design feedback and potential validation partnerships. Any future evaluation depends on appropriate hospital authorization, data governance, technical readiness, and a clinical validation protocol.",
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            reveal.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
    const sections = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -60% 0px" },
    );
    document
      .querySelectorAll("main > section[id]")
      .forEach((el) => sections.observe(el));
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      reveal.disconnect();
      sections.disconnect();
      removeEventListener("scroll", update);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const nav = [
    { name: "The vision", id: "vision" },
    { name: "The platform", id: "platform" },
    { name: "The research", id: "research" },
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map((link) => (
              <a
                key={link.id}
                className={activeSection === link.id ? "active" : ""}
                href={`#${link.id}`}
              >
                {link.name}
              </a>
            ))}
          </nav>
          <button className="header-cta" onClick={() => setDialog("contact")}>
            Let’s connect <ArrowUpRight size={16} />
          </button>
          <button
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <div ref={progressRef} className="reading-progress" />
        {menuOpen && (
          <nav
            className="mobile-nav"
            id="mobile-menu"
            aria-label="Mobile navigation"
          >
            {nav.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
                <ArrowUpRight size={20} />
              </a>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                setDialog("contact");
              }}
            >
              Let’s connect <ArrowUpRight size={20} />
            </button>
          </nav>
        )}
      </header>
      <main id="main">
        <section className="hero section-shell" id="home">
          <div className="hero-topline">
            <span className="eyebrow">
              <span className="live-dot" /> A NEW PERSPECTIVE ON CRITICAL CARE
            </span>
            <span className="hero-edition">HUMAN INSIGHT. CONNECTED.</span>
          </div>
          <div className="hero-layout">
            <div className="hero-copy">
              <h1>
                Clarity for
                <br />
                every <span>breath.</span>
              </h1>
              <p className="hero-description">
                Behind every signal is a person.
                <br />
                We’re bringing the bigger picture into focus.
              </p>
              <p className="hero-detail">
                AI-assisted respiratory decision support, designed to connect
                the dots for ICU care teams.
              </p>
              <div className="hero-actions">
                <a className="button button-red" href="#platform">
                  Discover PulseMind <ArrowUpRight size={18} />
                </a>
                <a className="quiet-link" href="#vision">
                  See the vision{" "}
                  <span>
                    <ArrowDown size={15} />
                  </span>
                </a>
              </div>
              <div className="hero-stage">
                <span className="stage-cross">+</span> RESEARCH IN PROGRESS.
                PEOPLE AT THE CENTER.
              </div>
            </div>
            <div
              className="hero-visual"
              ref={heroRef}
              onPointerMove={(e) => {
                if (
                  matchMedia("(prefers-reduced-motion: reduce)").matches ||
                  e.pointerType === "touch"
                )
                  return;
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--mx",
                  `${(e.clientX - rect.left - rect.width / 2) * 0.015}px`,
                );
                e.currentTarget.style.setProperty(
                  "--my",
                  `${(e.clientY - rect.top - rect.height / 2) * 0.015}px`,
                );
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty("--mx", "0px");
                e.currentTarget.style.setProperty("--my", "0px");
              }}
            >
              <div className="hero-orbit" aria-hidden="true" />
              <span className="visual-cross cross-one" aria-hidden="true">
                +
              </span>
              <span className="visual-cross cross-two" aria-hidden="true">
                +
              </span>
              <img
                className="lung-art"
                src="/images/pulsemind-lungs.png"
                alt="A pair of translucent crimson glass lungs, connected by delicate branching fibers"
                width="1254"
                height="1254"
                fetchPriority="high"
              />
              <div className="art-label label-top">
                <span className="label-icon">
                  <Activity size={15} />
                </span>
                <div>
                  <strong>Many signals.</strong>
                  <span>ONE CONNECTED PICTURE</span>
                </div>
                <i />
              </div>
              <div className="art-label label-bottom">
                <span className="live-dot" />
                <span>
                  Designed around
                  <br />
                  <strong>the human behind the data.</strong>
                </span>
              </div>
              <div className="visual-index">
                <span>FIG. 01 / THE ART OF SEEING MORE</span>
                <ArrowDownRight size={17} />
              </div>
            </div>
          </div>
          <div className="hero-bottom">
            <a href="#vision" className="scroll-link">
              <span>
                <ArrowDown size={14} />
              </span>{" "}
              A clearer perspective starts here
            </a>
            <div className="mini-wave" aria-hidden="true">
              <svg viewBox="0 0 150 30">
                <path d="M0 15h30l5-3 6 6 5-7 6 4h15l5-10 7 22 8-18 6 6h57" />
              </svg>
            </div>
            <span className="hero-bottom-note">
              BUILT FOR THE PEOPLE WHO CARE.
            </span>
          </div>
        </section>
        <div className="source-strip">
          <div className="section-shell">
            <span>
              ONE PATIENT.
              <br />
              <strong>MANY PERSPECTIVES.</strong>
            </span>
            <span>
              <Activity /> Ventilator data
            </span>
            <span>
              <Monitor /> Bedside monitors
            </span>
            <span>
              <FlaskConical /> Laboratory results
            </span>
            <span>
              <Fingerprint /> Clinical context
            </span>
          </div>
        </div>
        <section className="vision section-shell" id="vision">
          <div className="section-kicker reveal">
            <span>01 / THE VISION</span>
            <span>FROM FRAGMENTED TO FOCUSED</span>
          </div>
          <div className="vision-heading reveal">
            <h2>
              More information.
              <br />
              <span>A clearer understanding.</span>
            </h2>
            <p>
              In an ICU, the picture is constantly changing. Measurements live
              on different screens. Trends unfold across time. The challenge is
              bringing them together.
              <br />
              <br />
              <strong>
                PulseMind is exploring a more connected way to see.
              </strong>
            </p>
          </div>
          <div className="signal-story reveal">
            <div className="signal-story-label">
              <span className="number-badge">01—06</span>
              <span>
                Different sources.
                <br />
                Pieces of the same story.
              </span>
            </div>
            <SignalField />
            <div className="signal-destination">
              <PulseMark />
              <span>
                One patient.
                <br />
                <strong>A fuller perspective.</strong>
              </span>
            </div>
          </div>
          <div className="principles">
            <article className="reveal">
              <span className="principle-icon">
                <Layers3 size={22} />
              </span>
              <span className="principle-number">01</span>
              <h3>Bring the pieces together.</h3>
              <p>
                Explore ventilator, monitor, and laboratory information on a
                shared timeline.
              </p>
            </article>
            <article className="reveal">
              <span className="principle-icon">
                <Eye size={23} />
              </span>
              <span className="principle-number">02</span>
              <h3>Make the change visible.</h3>
              <p>
                Look beyond individual readings to see trends, contributing
                factors, and context.
              </p>
            </article>
            <article className="reveal">
              <span className="principle-icon">
                <ShieldCheck size={23} />
              </span>
              <span className="principle-number">03</span>
              <h3>Keep the clinician in control.</h3>
              <p>
                Make data limitations explicit. Support independent review and
                clinical judgment.
              </p>
            </article>
          </div>
        </section>
        <section className="platform" id="platform">
          <div className="section-shell">
            <div className="section-kicker reveal">
              <span>02 / THE PLATFORM</span>
              <span>
                <span className="live-dot" /> A WORKING IDEA. OPEN TO
                EXPLORATION.
              </span>
            </div>
            <div className="platform-heading reveal">
              <h2>
                From a sea of signals.
                <br />
                To a story you can <em>see.</em>
              </h2>
              <p>
                Go from the whole unit to the details that matter.
                <br />
                Explore a little of what we’re building.
              </p>
            </div>
            <div className="reveal">
              <ProductDemo />
            </div>
          </div>
        </section>
        <section className="research section-shell" id="research">
          <div className="section-kicker reveal">
            <span>03 / THE RESEARCH</span>
            <span>LISTEN FIRST. BUILD WITH PURPOSE.</span>
          </div>
          <div className="research-heading reveal">
            <h2>
              Better questions.
              <br />
              <span>Human answers.</span>
            </h2>
            <div>
              <p>
                Our direction starts with the people doing the work. An
                exploratory survey of ICU professionals is helping shape what
                PulseMind should become.
              </p>
              <button
                className="text-link"
                onClick={() => setDialog("research")}
              >
                Behind the numbers <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
          <div className="research-stats">
            <article className="reveal">
              <span className="stat-category">THE PEOPLE</span>
              <div className="stat-number">36</div>
              <h3>ICU voices. One conversation.</h3>
              <p>
                22 nurses and 14 physicians with recent experience caring for
                ventilated adults.
              </p>
              <span className="stat-footnote">36 ELIGIBLE RESPONDENTS</span>
            </article>
            <article className="reveal">
              <span className="stat-category">THE PICTURE</span>
              <div className="stat-number">
                4.25<span>/6</span>
              </div>
              <h3>Sources in the picture.</h3>
              <p>
                Information-source groups selected per person, on average,
                during respiratory review.
              </p>
              <span className="stat-footnote">
                MEAN ACROSS SIX COMPARABLE GROUPS
              </span>
            </article>
            <article className="reveal">
              <span className="stat-category">THE POSSIBILITY</span>
              <div className="stat-number">
                77.8<span>%</span>
              </div>
              <h3>See potential in the concept.</h3>
              <p>
                Rated it useful or very useful, if validated for safety and
                suited to clinical workflows.
              </p>
              <span className="stat-footnote">
                28 OF 36 RESPONDENTS · CONDITIONAL
              </span>
            </article>
          </div>
          <p className="evidence-note">
            <CirclePlus size={14} /> Early insight, not proof of clinical
            benefit. These exploratory findings guide design; clinical and
            usability validation are still ahead.
          </p>
        </section>
        <section className="human-section">
          <div className="section-shell human-layout">
            <div className="human-heading reveal">
              <span className="eyebrow">OUR GUIDING PRINCIPLE</span>
              <h2>
                Intelligence
                <br />
                in service of
                <br />
                <span>human care.</span>
              </h2>
              <div className="human-seal">
                <Fingerprint size={42} strokeWidth={1} />
                <span>
                  TECHNOLOGY SUPPORTS.
                  <br />
                  <strong>PEOPLE DECIDE.</strong>
                </span>
              </div>
            </div>
            <div className="human-content reveal">
              <p className="human-lead">
                The most important part
                <br />
                of the system is <em>you.</em>
              </p>
              <p>
                PulseMind is being designed to support the expertise of care
                teams. To bring context into view. To make the reasoning easier
                to examine. To be clear about what it doesn’t know.
              </p>
              <div className="human-promises">
                <span>
                  <Check size={16} /> Read-only by design
                </span>
                <span>
                  <Check size={16} /> Visible data quality and limitations
                </span>
                <span>
                  <Check size={16} /> Every clinical decision stays with
                  clinicians
                </span>
              </div>
              <div className="development-note">
                <span className="live-dot" />
                <div>
                  <strong>A prototype with a responsible path forward.</strong>
                  <p>
                    Retrospective validation comes next. Any future hospital
                    evaluation requires clinical, technical, and governance
                    review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="faq section-shell" id="questions">
          <div className="faq-intro reveal">
            <span className="eyebrow">A LITTLE MORE CONTEXT</span>
            <h2>
              Good questions.
              <br />
              Clear answers.
            </h2>
          </div>
          <div className="faq-list reveal">
            {questions.map((item, index) => (
              <article
                className={`faq-item ${faq === index ? "open" : ""}`}
                key={item.q}
              >
                <h3>
                  <button
                    aria-expanded={faq === index}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                    onClick={() => setFaq(faq === index ? null : index)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={20} />
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  hidden={faq !== index}
                >
                  <p>{item.a}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="contact-section" id="connect">
          <div className="section-shell">
            <div className="section-kicker">
              <span>THE NEXT CHAPTER IS A SHARED ONE.</span>
              <span>LET'S BUILD IT TOGETHER.</span>
            </div>
            <div className="contact-headline reveal">
              <h2>
                A clearer future.
                <br />
                Starts with a <span>conversation.</span>
              </h2>
              <button
                className="contact-circle"
                onClick={() => setDialog("contact")}
                aria-label="Start a conversation with PulseMind"
              >
                <MoveUpRight strokeWidth={1.3} />
              </button>
            </div>
            <div className="contact-bottom">
              <p>
                For clinicians, researchers, and hospital partners
                <br />
                who see the possibility of a more connected ICU.
              </p>
              <button
                className="button button-white"
                onClick={() => setDialog("contact")}
              >
                Let’s move care forward <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="contact-watermark" aria-hidden="true">
              PulseMind
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer section-shell">
        <div className="footer-top">
          <Brand />
          <span>Clarity for every breath.</span>
          <a href="#home">
            Back to the top <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PulseMind</span>
          <p>
            Research prototype. Not clinically validated.
            <br />
            Designed for decision support. Always guided by people.
          </p>
          <button onClick={() => setDialog("research")}>
            Research & limitations <ArrowRight size={13} />
          </button>
        </div>
      </footer>
      <Dialogs kind={dialog} close={() => setDialog(null)} />
    </>
  );
}
