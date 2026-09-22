import React, { useState } from "react";
import { PageHeader } from "../components/ui";
const ADDRESS = "oliver.t.perrin@gmail.com";
export default function ContactPage() {
  const [draft, setDraft] = useState(null);
  const [feedback, setFeedback] = useState("");
  function prepare(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setDraft({
      subject: `PlayAxis: ${data.get("subject")}`,
      body: `From: ${data.get("name")} <${data.get("email")}>\n\n${data.get("message")}`,
    });
    setFeedback(
      "Your draft is ready. Open your email app to review and send it.",
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="We’re listening"
        title="Let’s talk"
        description="Found a problem, have an idea, or need a hand with your account?"
      />
      <div className="detail-layout">
        <form
          className="panel panel-pad"
          onSubmit={prepare}
          onChange={() => {
            setDraft(null);
            setFeedback("");
          }}
        >
          <div className="form-grid">
            <label>
              Your name
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
            <label>
              Email address
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label className="full">
              Subject
              <select name="subject">
                <option>Something isn’t working</option>
                <option>Account or privacy help</option>
                <option>A suggestion</option>
                <option>Community concern</option>
              </select>
            </label>
            <label className="full">
              Your message
              <textarea
                name="message"
                rows={6}
                minLength={5}
                maxLength={3000}
                required
              />
            </label>
          </div>
          <button className="button primary" style={{ marginTop: 22 }}>
            Prepare email
          </button>
          {draft && (
            <div className="notice">
              <div>
                <p role="status">{feedback}</p>
                <div className="form-actions">
                  <a
                    className="button secondary"
                    href={`mailto:${ADDRESS}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
                  >
                    Open email app
                  </a>
                  <button
                    type="button"
                    className="text-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${draft.subject}\n\n${draft.body}`,
                        );
                        setFeedback(
                          "Draft copied. Paste it into an email to " +
                            ADDRESS +
                            ".",
                        );
                      } catch {
                        setFeedback(
                          "You can copy your message from the form and email it directly.",
                        );
                      }
                    }}
                  >
                    Copy draft
                  </button>
                </div>
              </div>
            </div>
          )}
          <p className="source-note">
            This form prepares a draft. The message is sent only when you send
            it from your email app.
          </p>
        </form>
        <aside className="panel panel-pad" style={{ alignSelf: "start" }}>
          <h3>Prefer to write directly?</h3>
          <p className="source-note" style={{ marginBottom: 12 }}>
            Include the page and what happened so we can take a closer look.
          </p>
          <a
            className="text-link"
            style={{ overflowWrap: "anywhere" }}
            href={`mailto:${ADDRESS}`}
          >
            {ADDRESS}
          </a>
        </aside>
      </div>
    </>
  );
}
