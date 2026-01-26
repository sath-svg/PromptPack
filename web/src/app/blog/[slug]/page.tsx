import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} - PromptPack Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://pmtpk.com/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: `https://pmtpk.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "PromptPack",
      url: "https://pmtpk.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://pmtpk.com/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="blog-post">
        <header className="blog-post-header">
          <Link href="/blog" className="blog-back-link">
            &larr; Back to Blog
          </Link>
          <div className="blog-post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="blog-card-tag">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="blog-post-meta">
            <span>{post.author}</span>
            <span className="blog-card-dot" />
            <time dateTime={post.date}>{formattedDate}</time>
          </div>
        </header>

        <div className="blog-post-content">{post.content}</div>

        <footer className="blog-post-footer">
          <div className="blog-post-cta">
            <h3>Ready to build your prompt library?</h3>
            <p>
              Save, organize, and reuse your best AI prompts across ChatGPT,
              Claude, and Gemini.
            </p>
            <Link href="/" className="btn btn-primary">
              Get PromptPack — Free
            </Link>
          </div>
        </footer>
      </article>
    </>
  );
}
