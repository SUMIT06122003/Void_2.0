import { CalendarDays, UserRound } from "lucide-react";
import { categoryToSlug } from "../utils/catalog";

function BlogPage({ blogs = [], currentPath = "/blog" }) {
  const slug = currentPath.replace(/^\/blog\/?/, "");
  const selectedBlog = slug
    ? blogs.find((blog) => categoryToSlug(blog.slug || blog.title || blog.id) === slug || String(blog.id || "") === slug)
    : null;

  if (selectedBlog) {
    return (
      <section className="page-section blog-page blog-detail-page">
        {selectedBlog.image ? (
          <div className="blog-detail-media">
            <img src={selectedBlog.image} alt={selectedBlog.title} />
          </div>
        ) : null}
        <div className="page-heading">
          <span>VOID Journal</span>
          <h1>{selectedBlog.title}</h1>
          <p>{selectedBlog.excerpt}</p>
        </div>
        <div className="blog-meta-row">
          <span><UserRound size={16} /> {selectedBlog.author || "VOID Team"}</span>
          <span><CalendarDays size={16} /> {formatDate(selectedBlog.publishedAt)}</span>
        </div>
        <article className="blog-body">
          {String(selectedBlog.body || selectedBlog.excerpt || "")
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
      </section>
    );
  }

  return (
    <section className="page-section blog-page">
      <div className="page-heading">
        <span>Blog</span>
        <h1>VOID Journal</h1>
        <p>Training notes, launch stories, and discipline-first activewear updates.</p>
      </div>
      {blogs.length ? (
        <div className="blog-grid">
          {blogs.map((blog) => (
            <a className="blog-card" href={`#/blog/${categoryToSlug(blog.slug || blog.title || blog.id)}`} key={blog.id || blog.title}>
              {blog.image ? <img src={blog.image} alt={blog.title} /> : <div className="blog-card-placeholder">VOID</div>}
              <div>
                <span>{formatDate(blog.publishedAt)}</span>
                <h2>{blog.title}</h2>
                <p>{blog.excerpt || "Read the latest from VOID."}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="account-empty">
          <span>Blog</span>
          <h3>No posts yet</h3>
          <p>Published admin blog posts will appear here.</p>
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "Not dated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default BlogPage;
