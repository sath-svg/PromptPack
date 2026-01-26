import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog - PromptPack | AI Prompt Tips, Guides & Workflows",
  description:
    "Learn how to save, organize, and reuse your best AI prompts. Tips for ChatGPT, Claude, and Gemini power users.",
  openGraph: {
    title: "Blog - PromptPack",
    description:
      "Learn how to save, organize, and reuse your best AI prompts.",
    url: "https://pmtpk.com/blog",
  },
  alternates: {
    canonical: "https://pmtpk.com/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="blog-listing">
      <div className="blog-listing-header">
        <h1 className="blog-listing-title">Blog</h1>
        <p className="blog-listing-subtitle">
          Tips, guides, and workflows for getting the most out of AI prompts.
        </p>
      </div>

      <div className="blog-listing-grid">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="blog-card"
          >
            <div className="blog-card-tags">
              {post.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="blog-card-tag">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="blog-card-title">{post.title}</h2>
            <p className="blog-card-excerpt">{post.excerpt}</p>
            <div className="blog-card-meta">
              <span>{post.author}</span>
              <span className="blog-card-dot" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
