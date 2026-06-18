"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiDelete, apiGet, apiPost, apiPut, getApiErrorMessage } from "@/lib/api";
import { resolveBlogMediaUrl, resolveMediaUrl, STOREFRONT_ORIGIN } from "@/lib/utils";
import { MediaImagePicker } from "@/components/shared/media-image-picker";
import { useAuthStore } from "@/store/authStore";

/** Same featured images used on the storefront blog page. */
const FRONTEND_BLOG_IMAGES = [
  {
    path: "/images/chaunsa-premium-variety.png",
    label: "Chaunsa King Of Fruits",
  },
  {
    path: "/images/anwar-ratol-mango.png",
    label: "History Of E Royal Mango",
  },
] as const;

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  category: "Uncategorized",
  author: "E Royal Mango",
  authorEmail: "info@eroyalmango.com",
  status: "published",
};

function slugPreview(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission("create");
  const canEdit = hasPermission("edit");
  const canDelete = hasPermission("delete");

  const [blogs, setBlogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: Record<string, unknown>[] }>("/blogs", { limit: 100 });
      setBlogs(res.items ?? []);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const filteredBlogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter((row) => {
      const title = String(row.title ?? "").toLowerCase();
      const category = String(row.category ?? row.categoryName ?? "").toLowerCase();
      return title.includes(q) || category.includes(q);
    });
  }, [blogs, search]);

  const openAddPanel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setPanelOpen(true);
  };

  const openEditPanel = useCallback((blog: Record<string, unknown>) => {
    setForm({
      title: String(blog.title ?? ""),
      slug: String(blog.slug ?? ""),
      excerpt: String(blog.excerpt ?? ""),
      content: String(blog.content ?? ""),
      featuredImage: String(blog.featuredImage ?? ""),
      category: String(blog.category ?? blog.categoryName ?? "Uncategorized"),
      author: String(blog.author ?? "E Royal Mango"),
      authorEmail: String(blog.authorEmail ?? "info@eroyalmango.com"),
      status: String(blog.status ?? "published"),
    });
    setEditingId(String(blog._id ?? blog.id));
    setFormError(null);
    setPanelOpen(true);
  }, []);

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingId && !canEdit) {
      setFormError("You do not have permission to edit blog posts.");
      return;
    }
    if (!editingId && !canCreate) {
      setFormError("You do not have permission to create blog posts.");
      return;
    }

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      featuredImage: form.featuredImage.trim() || undefined,
      category: form.category.trim() || "Uncategorized",
      author: form.author.trim() || "E Royal Mango",
      authorEmail: form.authorEmail.trim() || undefined,
      status: form.status,
    };

    try {
      if (editingId) {
        await apiPut(`/blogs/${editingId}`, payload);
        setSuccessMessage("Blog post updated successfully.");
      } else {
        await apiPost("/blogs", payload);
        setSuccessMessage("Blog post created successfully.");
      }
      closePanel();
      await loadBlogs();
      window.setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, "Could not save blog post. Please check the form and try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!canDelete) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await apiDelete(`/blogs/${id}`);
    setSuccessMessage("Blog post deleted.");
    await loadBlogs();
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div>
      <PageHeader
        title="Blogs"
        description="Create and manage blog posts shown on the storefront blog page"
      />

      <div className="admin-content space-y-4">
        {successMessage && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Blog Posts</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Published posts appear automatically on the website blog page.
              </p>
            </div>
            {canCreate && (
              <Button type="button" onClick={openAddPanel}>
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading blog posts…</p>
            ) : filteredBlogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No posts match your search." : "No blog posts yet. Click Add Post to create one."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Image</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Author</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlogs.map((row) => {
                      const id = String(row._id ?? row.id);
                      const image = String(row.featuredImage ?? "");
                      const slug = String(row.slug ?? "");
                      const title = String(row.title ?? "-");

                      return (
                        <tr
                          key={id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolveBlogMediaUrl(image)}
                                alt=""
                                className="h-11 w-16 rounded-md border border-border object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-16 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-[10px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">{title}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {String(row.category ?? row.categoryName ?? "—")}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {String(row.author ?? "—")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={row.status === "published" ? "default" : "secondary"}>
                              {String(row.status ?? "-")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(row.createdAt ?? row.publishedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {canEdit && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditPanel(row)}
                                >
                                  Edit
                                </Button>
                              )}
                              {slug && row.status === "published" && (
                                <Button type="button" size="sm" variant="outline" asChild>
                                  <a
                                    href={`${STOREFRONT_ORIGIN}/blog/${slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View
                                  </a>
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(id, title)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close panel"
            onClick={closePanel}
          />
          <div className="relative flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit Blog Post" : "Add Blog Post"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Set status to Published to show the post on the website.
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-md p-2 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Post details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Chaunsa King Of Fruits"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL slug (optional)</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="Leave empty to auto-generate"
                    />
                    {form.title && !form.slug && (
                      <p className="text-xs text-muted-foreground">
                        Auto slug: {slugPreview(form.title)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={form.excerpt}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                      placeholder="Short summary shown on blog cards"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content (HTML)</Label>
                    <Textarea
                      id="content"
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      placeholder="<p>Write your blog post content here...</p>"
                      rows={10}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt; for formatting.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <Label>Featured image</Label>
                  <p className="text-xs text-muted-foreground">
                    Pick a storefront image or upload your own.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {FRONTEND_BLOG_IMAGES.map((item) => {
                      const selected = form.featuredImage === item.path;
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, featuredImage: item.path }))}
                          className={`overflow-hidden rounded-lg border-2 text-left transition-colors ${
                            selected ? "border-primary" : "border-border hover:border-primary/50"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveMediaUrl(item.path)}
                            alt={item.label}
                            className="h-28 w-full object-cover"
                          />
                          <p className="px-2 py-2 text-xs text-muted-foreground">{item.label}</p>
                        </button>
                      );
                    })}
                  </div>
                  <MediaImagePicker
                    label="Or upload / pick from library"
                    maxImages={1}
                    helpText="Upload JPG, PNG, or WebP (max 10MB) or choose from the media library."
                    value={form.featuredImage ? [form.featuredImage] : []}
                    onChange={(urls) =>
                      setForm((f) => ({ ...f, featuredImage: urls[0] ?? "" }))
                    }
                  />
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Meta
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        placeholder="Uncategorized"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={form.author}
                        onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorEmail">Author email</Label>
                      <Input
                        id="authorEmail"
                        type="email"
                        value={form.authorEmail}
                        onChange={(e) => setForm((f) => ({ ...f, authorEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                </section>

                {formError && <p className="text-sm text-destructive">{formError}</p>}
              </div>

              <div className="flex gap-3 border-t border-border px-5 py-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Post"}
                </Button>
                <Button type="button" variant="outline" onClick={closePanel}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
