import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Check, Download, X } from "lucide-react";
import { PulseMark } from "./Brand";

export type DialogKind = "contact" | "research" | null;
export default function Dialogs({
  kind,
  close,
}: {
  kind: DialogKind;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [prepared, setPrepared] = useState(false);
  const [emailLink, setEmailLink] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    const dialog = ref.current!;
    if (!kind) return;
    const previous = document.activeElement as HTMLElement | null;
    setPrepared(false);
    setDraft({});
    setEmailLink("");
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [kind]);
  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setDraft(
      Object.fromEntries(
        [...data.entries()].map(([key, value]) => [key, String(value)]),
      ),
    );
    const body = `Hello PulseMind,\n\nI'm ${data.get("name")}, ${data.get("role")} at ${data.get("organization")}.\n\nI'm interested in ${data.get("interest")}.\n\n${data.get("message") || ""}\n\nYou can reach me at ${data.get("email")}.\n\nBest,\n${data.get("name")}`;
    setEmailLink(
      `mailto:khanh.nguyenl3ph@hcmut.edu.vn?subject=${encodeURIComponent("PulseMind — " + data.get("interest"))}&body=${encodeURIComponent(body)}`,
    );
    setPrepared(true);
  }
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            close();
        }
      }}
    >
      <button className="modal-close" onClick={close} aria-label="Close dialog">
        <X size={22} />
      </button>
      <PulseMark className="modal-mark" />
      {kind === "research" ? (
        <>
          <p className="eyebrow">THE RESEARCH / EXPLORATORY FINDINGS</p>
          <h2 id="modal-title">Start by listening.</h2>
          <p className="modal-intro">
            36 ICU professionals. Two surveys. One direction: make the
            information easier to bring together.
          </p>
          <div className="research-table">
            <div>
              <strong>36</strong>
              <span>
                Eligible respondents: 22 ICU nurses and 14 ICU physicians, all
                with recent experience caring for mechanically ventilated
                adults.
              </span>
            </div>
            <div>
              <strong>4.25</strong>
              <span>
                Average information-source groups selected per respondent, from
                six comparable groups. This does not measure time spent or
                technical fragmentation.
              </span>
            </div>
            <div>
              <strong>77.8%</strong>
              <span>
                28 of 36 rated the concept useful or very useful, conditional on
                safety validation and a fit with clinical workflows.
              </span>
            </div>
          </div>
          <div className="research-boundary">
            <h3>What these findings tell us</h3>
            <p>
              They inform design priorities. The small, exploratory sample and
              differing questionnaires do not establish clinical performance,
              usability, adoption, or improved patient outcomes. Prototype
              feedback was collected only in the 14-person subgroup.
            </p>
          </div>
          <a className="button button-red" href="/research-brief.md" download>
            Download the research brief <Download size={16} />
          </a>
          <p className="modal-footnote">
            Based on the updated Survey Result.md supplied by the PulseMind
            team. Its figures supersede the earlier project report.
          </p>
        </>
      ) : (
        <>
          <p className="eyebrow">LET'S MOVE CARE FORWARD</p>
          <h2 id="modal-title">
            A conversation
            <br />
            worth starting.
          </h2>
          <p className="modal-intro">
            For clinicians, researchers, and hospital teams interested in
            shaping what comes next.
          </p>
          {prepared ? (
            <div className="contact-prepared" role="status">
              <span className="prepared-icon">
                <Check size={26} />
              </span>
              <h3>Your introduction is ready.</h3>
              <p>
                Open it in your email app, review it, and send it when you’re
                ready. Nothing has been sent or stored by this website.
              </p>
              <a className="button button-red" href={emailLink}>
                Open email draft <ArrowUpRight size={17} />
              </a>
              <button
                className="text-button"
                onClick={() => setPrepared(false)}
              >
                Edit your introduction
              </button>
              <a
                className="direct-email"
                href="mailto:khanh.nguyenl3ph@hcmut.edu.vn"
              >
                khanh.nguyenl3ph@hcmut.edu.vn
              </a>
            </div>
          ) : (
            <form onSubmit={prepareEmail} className="contact-form">
              <div className="form-pair">
                <label>
                  Your name
                  <input
                    name="name"
                    defaultValue={draft.name ?? ""}
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Work email
                  <input
                    name="email"
                    defaultValue={draft.email ?? ""}
                    type="email"
                    autoComplete="email"
                    placeholder="alex@hospital.org"
                    required
                    maxLength={200}
                  />
                </label>
              </div>
              <div className="form-pair">
                <label>
                  Organization
                  <input
                    name="organization"
                    defaultValue={draft.organization ?? ""}
                    autoComplete="organization"
                    placeholder="Hospital or institution"
                    required
                    maxLength={150}
                  />
                </label>
                <label>
                  Your role
                  <select name="role" required defaultValue={draft.role ?? ""}>
                    <option value="" disabled>
                      Select your role
                    </option>
                    <option>an ICU clinician</option>
                    <option>a researcher</option>
                    <option>a hospital leader</option>
                    <option>a technology partner</option>
                    <option>an interested collaborator</option>
                  </select>
                </label>
              </div>
              <label>
                I'm interested in
                <select
                  name="interest"
                  defaultValue={
                    draft.interest ?? "clinical research collaboration"
                  }
                >
                  <option>clinical research collaboration</option>
                  <option>prototype feedback</option>
                  <option>hospital validation partnerships</option>
                  <option>learning more about PulseMind</option>
                </select>
              </label>
              <label>
                A little about your interest <span>(optional)</span>
                <textarea
                  name="message"
                  defaultValue={draft.message ?? ""}
                  placeholder="Tell us what you have in mind…"
                  rows={3}
                  maxLength={1500}
                />
              </label>
              <button className="button button-red" type="submit">
                Prepare an introduction <ArrowUpRight size={17} />
              </button>
              <p className="modal-footnote">
                Creates an email draft for you to review and send. Your details
                are not stored by this site. Please do not include patient
                information.
              </p>
            </form>
          )}
        </>
      )}
    </dialog>
  );
}
