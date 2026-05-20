"use client";

import { useState, useRef, useEffect } from "react";

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open support modal
  useEffect(() => {
    const handleOpenSupport = () => setIsOpen(true);
    window.addEventListener("open-support", handleOpenSupport);
    return () => window.removeEventListener("open-support", handleOpenSupport);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add attachments to form data
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setSubmitted(true);
      form.reset();
      setAttachments([]);

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        title="Contact Support"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "#2563EB",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px -8px rgba(37,99,235,0.6)",
          transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.background = "#1d4ed8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.background = "#2563EB";
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "1.5rem",
            zIndex: 1001,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          {/* Modal Content */}
          <div
            style={{
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "380px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
              color: "#e4e4e7",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 500, color: "#fafafa", letterSpacing: "-0.01em" }}>
                Contact Support
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#71717a",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            {submitted ? (
              <div
                style={{
                  padding: "3rem 1.25rem",
                  textAlign: "center",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  style={{ marginBottom: "1rem" }}
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p style={{ color: "#a1a1aa", margin: 0 }}>
                  Message sent. We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  overflow: "auto",
                }}
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      marginBottom: "0.4rem",
                      color: "#a1a1aa",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Your email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                      color: "#fafafa",
                      fontSize: "0.875rem",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      marginBottom: "0.4rem",
                      color: "#a1a1aa",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                      color: "#fafafa",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  >
                    <option value="General Question" style={{ background: "#0f0f12", color: "#fafafa" }}>General Question</option>
                    <option value="Bug/Technical Issue" style={{ background: "#0f0f12", color: "#fafafa" }}>Bug/Technical Issue</option>
                    <option value="Billing Issue" style={{ background: "#0f0f12", color: "#fafafa" }}>Billing Issue</option>
                    <option value="Other" style={{ background: "#0f0f12", color: "#fafafa" }}>Other</option>
                  </select>
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#a1a1aa",
                      lineHeight: 1.5,
                    }}
                  >
                    Suggesting a feature?{" "}
                    <a
                      href="/feedback"
                      style={{ color: "#60a5fa", textDecoration: "underline" }}
                    >
                      Vote on the public roadmap →
                    </a>
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      marginBottom: "0.4rem",
                      color: "#a1a1aa",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Describe your issue or question. You can include links here."
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                      color: "#fafafa",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      minHeight: "100px",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      marginBottom: "0.4rem",
                      color: "#a1a1aa",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Attachments
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.txt,.log"
                    multiple
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px dashed rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.02)",
                      color: "#a1a1aa",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      width: "100%",
                      justifyContent: "center",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Add files (images, PDF, text)
                  </button>

                  {/* Attachment list */}
                  {attachments.length > 0 && (
                    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.4rem 0.6rem",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "0.35rem",
                            fontSize: "0.75rem",
                            color: "#d4d4d8",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#71717a",
                              cursor: "pointer",
                              padding: "0.25rem",
                              display: "flex",
                              flexShrink: 0,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <p style={{ color: "#f87171", fontSize: "0.8rem", margin: 0 }}>
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "0.7rem 1rem",
                    borderRadius: "9999px",
                    border: "none",
                    background: "#2563EB",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.6 : 1,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px -12px rgba(37,99,235,0.6)",
                    transition: "background 0.15s, transform 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = "#1d4ed8";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = "#2563EB";
                  }}
                >
                  {isSubmitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
