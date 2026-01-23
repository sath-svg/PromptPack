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
          background: "var(--accent)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transition: "transform 0.2s, box-shadow 0.2s",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
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
              background: "var(--bg, #1a1a1a)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "380px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid rgba(128,128,128,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                Contact Support
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                }}
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
                  stroke="var(--accent)"
                  strokeWidth="2"
                  style={{ marginBottom: "1rem" }}
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Message sent! We'll get back to you soon.
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
                      fontSize: "0.875rem",
                      marginBottom: "0.5rem",
                      color: "var(--muted)",
                    }}
                  >
                    Your Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(128,128,128,0.3)",
                      background: "rgba(128,128,128,0.1)",
                      color: "inherit",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      marginBottom: "0.5rem",
                      color: "var(--muted)",
                    }}
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(128,128,128,0.3)",
                      background: "#2a2a2a",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="General Question" style={{ background: "#2a2a2a", color: "white" }}>General Question</option>
                    <option value="Bug/Technical Issue" style={{ background: "#2a2a2a", color: "white" }}>Bug/Technical Issue</option>
                    <option value="Feature Request" style={{ background: "#2a2a2a", color: "white" }}>Feature Request</option>
                    <option value="Billing Issue" style={{ background: "#2a2a2a", color: "white" }}>Billing Issue</option>
                    <option value="Other" style={{ background: "#2a2a2a", color: "white" }}>Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      marginBottom: "0.5rem",
                      color: "var(--muted)",
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Describe your issue or question... You can include links here."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(128,128,128,0.3)",
                      background: "rgba(128,128,128,0.1)",
                      color: "inherit",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      minHeight: "100px",
                    }}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      marginBottom: "0.5rem",
                      color: "var(--muted)",
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
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px dashed rgba(128,128,128,0.4)",
                      background: "transparent",
                      color: "var(--muted)",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      width: "100%",
                      justifyContent: "center",
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
                            padding: "0.5rem",
                            background: "rgba(128,128,128,0.1)",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
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
                              color: "var(--muted)",
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
                  <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }}>
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
