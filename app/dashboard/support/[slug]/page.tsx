// // TipTap original code
// // "use client";

// // import { useEffect, useState } from "react";
// // import { useParams, useRouter, useSearchParams } from "next/navigation";
// // import { DashboardLayout } from "@/components/dashboard-layout";
// // import { KBArticle } from "@/components/kb-article";
// // import { StaffAndAbove } from "@/components/role-guard";
// // import { Loader2, Pencil, Save, X, Globe } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { EditorContent, useEditor } from "@tiptap/react";
// // import StarterKit from "@tiptap/starter-kit";
// // import LinkExtension from "@tiptap/extension-link";
// // import Placeholder from "@tiptap/extension-placeholder";

// // interface SupportArticle {
// //   id: string;
// //   title: string;
// //   slug: string;
// //   summary: string | null;
// //   category: string | null;
// //   tags: string[];
// //   content: string;
// //   readTimeMinutes: number;
// //   authorId: string;
// //   authorName: string;
// //   companyId: string | null;
// //   isGlobal: boolean;
// //   canEdit: boolean;
// //   canDelete: boolean;
// //   updatedAt: string;
// // }

// // export default function SupportArticlePage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const searchParams = useSearchParams();
// //   const slug = params.slug as string;

// //   const [user, setUser] = useState<{
// //     name: string | null;
// //     email: string | null;
// //     image: string | null;
// //     role: string;
// //     id?: string;
// //   } | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [articleLoading, setArticleLoading] = useState(true);
// //   const [article, setArticle] = useState<SupportArticle | null>(null);
// //   const [saving, setSaving] = useState(false);
// //   const [scopeSaving, setScopeSaving] = useState(false);

// //   const initialMode = searchParams.get("mode");
// //   const [editMode, setEditMode] = useState(initialMode === "edit");

// //   const editor = useEditor({
// //     immediatelyRender: false,
// //     extensions: [
// //       StarterKit,
// //       LinkExtension.configure({
// //         openOnClick: true,
// //       }),
// //       Placeholder.configure({
// //         placeholder: "Write your article content here...",
// //       }),
// //     ],
// //     content: "",
// //   });

// //   // Fetch user
// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       try {
// //         const res = await fetch("/api/auth/me");
// //         const data = await res.json();
// //         if (!data?.authenticated || data?.user?.role === "GUEST") {
// //           router.push("/login");
// //           return;
// //         }
// //         setUser(data.user);
// //       } catch (error) {
// //         console.error("Auth check failed:", error);
// //         router.push("/login");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchUser();
// //   }, [router]);

// //   // Fetch article by slug
// //   useEffect(() => {
// //     if (!slug) return;
// //     const fetchArticle = async () => {
// //       try {
// //         const res = await fetch(
// //           `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
// //         );
// //         const data = await res.json();
// //         if (!res.ok) {
// //           console.error("Failed to load article:", data);
// //           return;
// //         }
// //         const a = data.article;
// //         const mapped: SupportArticle = {
// //           id: a.id,
// //           title: a.title,
// //           slug: a.slug,
// //           summary: a.summary ?? null,
// //           category: a.category ?? null,
// //           tags: Array.isArray(a.tags) ? a.tags : [],
// //           content: a.content,
// //           readTimeMinutes: a.readTimeMinutes ?? 5,
// //           authorId: a.authorId,
// //           authorName: a.author?.name || a.author?.email || "Author",
// //           companyId: a.companyId ?? null,
// //           isGlobal: !!a.isGlobal,
// //           canEdit: !!a.canEdit,
// //           canDelete: !!a.canDelete,
// //           updatedAt: a.updatedAt,
// //         };
// //         setArticle(mapped);
// //         if (editor) {
// //           editor.commands.setContent(mapped.content || "");
// //         }
// //       } catch (error) {
// //         console.error("Error fetching article:", error);
// //       } finally {
// //         setArticleLoading(false);
// //       }
// //     };

// //     fetchArticle();
// //   }, [slug, editor]);

// //   // Ensure edit mode only if allowed
// //   useEffect(() => {
// //     if (!article || !editMode) return;
// //     if (!article.canEdit) {
// //       setEditMode(false);
// //     }
// //   }, [article, editMode]);

// //   if (loading || articleLoading) {
// //     return (
// //       <DashboardLayout user={user || undefined}>
// //         <div className="flex items-center justify-center h-96">
// //           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   if (!article) {
// //     return (
// //       <DashboardLayout user={user || undefined}>
// //         <div className="flex items-center justify-center h-96">
// //           <p className="text-muted-foreground">Article not found.</p>
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   const handleSave = async () => {
// //     if (!editor) return;
// //     setSaving(true);
// //     try {
// //       const html = editor.getHTML();
// //       const res = await fetch(`/api/support/articles/${article.id}`, {
// //         method: "PATCH",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           content: html,
// //         }),
// //       });
// //       const data = await res.json().catch(() => null);
// //       if (!res.ok) {
// //         console.error("Failed to save article:", data);
// //         return;
// //       }
// //       setArticle((prev) => (prev ? { ...prev, content: html } : prev));
// //       setEditMode(false);
// //     } catch (error) {
// //       console.error("Save failed:", error);
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   return (
// //     <StaffAndAbove>
// //       <DashboardLayout user={user || undefined}>
// //         <div className="flex justify-end mb-4 max-w-4xl mx-auto">
// //           <div className="flex gap-2">
// //             {article.canEdit && !editMode && (
// //               <Button
// //                 size="sm"
// //                 variant="outline"
// //                 className="gap-2"
// //                 onClick={() => setEditMode(true)}
// //               >
// //                 <Pencil className="h-4 w-4" />
// //                 Edit Article
// //               </Button>
// //             )}
// //             {article.canEdit && editMode && (
// //               <>
// //                 <Button
// //                   size="sm"
// //                   variant="outline"
// //                   className="gap-2"
// //                   onClick={() => {
// //                     if (editor) {
// //                       editor.commands.setContent(article.content || "");
// //                     }
// //                     setEditMode(false);
// //                   }}
// //                   disabled={saving}
// //                 >
// //                   <X className="h-4 w-4" />
// //                   Cancel
// //                 </Button>
// //                 <Button
// //                   size="sm"
// //                   className="gap-2"
// //                   onClick={handleSave}
// //                   disabled={saving}
// //                 >
// //                   {saving ? (
// //                     <Loader2 className="h-4 w-4 animate-spin" />
// //                   ) : (
// //                     <Save className="h-4 w-4" />
// //                   )}
// //                   Save
// //                 </Button>
// //               </>
// //             )}
// //             {user?.role === "SUPER_ADMIN" && (
// //               <Button
// //                 size="sm"
// //                 variant={article.isGlobal ? "default" : "outline"}
// //                 className="gap-2"
// //                 disabled={scopeSaving}
// //                 onClick={async () => {
// //                   setScopeSaving(true);
// //                   try {
// //                     const res = await fetch(
// //                       `/api/support/articles/${article.id}`,
// //                       {
// //                         method: "PATCH",
// //                         headers: { "Content-Type": "application/json" },
// //                         body: JSON.stringify({
// //                           isGlobal: !article.isGlobal,
// //                         }),
// //                       }
// //                     );
// //                     const data = await res.json().catch(() => null);
// //                     if (!res.ok) {
// //                       console.error("Failed to change scope:", data);
// //                       return;
// //                     }
// //                     setArticle((prev) =>
// //                       prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
// //                     );
// //                   } catch (error) {
// //                     console.error("Scope toggle failed:", error);
// //                   } finally {
// //                     setScopeSaving(false);
// //                   }
// //                 }}
// //               >
// //                 {scopeSaving ? (
// //                   <Loader2 className="h-4 w-4 animate-spin" />
// //                 ) : (
// //                   <Globe className="h-4 w-4" />
// //                 )}
// //                 {article.isGlobal ? "Global" : "Make Global"}
// //               </Button>
// //             )}
// //           </div>
// //         </div>

// //         <KBArticle
// //           title={article.title}
// //           description={article.summary || ""}
// //           category={article.category || "Uncategorized"}
// //           tags={article.tags}
// //           readTime={`${article.readTimeMinutes} min`}
// //           lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
// //           scopeLabel={
// //             article.isGlobal ? "Global article" : "Company-scoped article"
// //           }
// //         >
// //           {editMode && editor ? (
// //             <div className="border rounded-md p-3">
// //               <EditorContent editor={editor} />
// //             </div>
// //           ) : (
// //             <div
// //               className="prose prose-slate dark:prose-invert max-w-none"
// //               dangerouslySetInnerHTML={{ __html: article.content }}
// //             />
// //           )}
// //         </KBArticle>
// //       </DashboardLayout>
// //     </StaffAndAbove>
// //   );
// // }

// // "use client";

// // import { useEffect, useState } from "react";
// // import { useParams, useRouter, useSearchParams } from "next/navigation";
// // import { DashboardLayout } from "@/components/dashboard-layout";
// // import { KBArticle } from "@/components/kb-article";
// // import { StaffAndAbove } from "@/components/role-guard";
// // import { Loader2, Pencil, Save, X, Globe } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Textarea } from "@/components/ui/textarea";
// // import { EditorContent, useEditor } from "@tiptap/react";
// // import StarterKit from "@tiptap/starter-kit";
// // import LinkExtension from "@tiptap/extension-link";
// // import Placeholder from "@tiptap/extension-placeholder";

// // interface SupportArticle {
// //   id: string;
// //   title: string;
// //   slug: string;
// //   summary: string | null;
// //   category: string | null;
// //   tags: string[];
// //   content: string;
// //   readTimeMinutes: number;
// //   authorId: string;
// //   authorName: string;
// //   companyId: string | null;
// //   isGlobal: boolean;
// //   canEdit: boolean;
// //   canDelete: boolean;
// //   updatedAt: string;
// // }

// // export default function SupportArticlePage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const searchParams = useSearchParams();
// //   const slug = params.slug as string;

// //   const [user, setUser] = useState<{
// //     name: string | null;
// //     email: string | null;
// //     image: string | null;
// //     role: string;
// //     id?: string;
// //   } | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [articleLoading, setArticleLoading] = useState(true);
// //   const [article, setArticle] = useState<SupportArticle | null>(null);
// //   const [saving, setSaving] = useState(false);
// //   const [scopeSaving, setScopeSaving] = useState(false);

// //   // Form state for editing
// //   const [formData, setFormData] = useState({
// //     title: "",
// //     summary: "",
// //     category: "",
// //     tags: "",
// //     readTimeMinutes: 5,
// //   });

// //   const initialMode = searchParams.get("mode");
// //   const [editMode, setEditMode] = useState(initialMode === "edit");

// //   const editor = useEditor({
// //     immediatelyRender: false, // Prevents hydration mismatch
// //     extensions: [
// //       StarterKit,
// //       LinkExtension.configure({
// //         openOnClick: true,
// //       }),
// //       Placeholder.configure({
// //         placeholder: "Write your article content here...",
// //       }),
// //     ],
// //     content: "",
// //   });

// //   // Fetch user
// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       try {
// //         const res = await fetch("/api/auth/me");
// //         const data = await res.json();
// //         if (!data?.authenticated || data?.user?.role === "GUEST") {
// //           router.push("/login");
// //           return;
// //         }
// //         setUser(data.user);
// //       } catch (error) {
// //         console.error("Auth check failed:", error);
// //         router.push("/login");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchUser();
// //   }, [router]);

// //   // Fetch article by slug
// //   useEffect(() => {
// //     if (!slug) return;
// //     const fetchArticle = async () => {
// //       try {
// //         const res = await fetch(
// //           `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
// //         );
// //         const data = await res.json();
// //         if (!res.ok) {
// //           console.error("Failed to load article:", data);
// //           return;
// //         }
// //         const a = data.article;
// //         const mapped: SupportArticle = {
// //           id: a.id,
// //           title: a.title,
// //           slug: a.slug,
// //           summary: a.summary ?? null,
// //           category: a.category ?? null,
// //           tags: Array.isArray(a.tags) ? a.tags : [],
// //           content: a.content,
// //           readTimeMinutes: a.readTimeMinutes ?? 5,
// //           authorId: a.authorId,
// //           authorName: a.author?.name || a.author?.email || "Author",
// //           companyId: a.companyId ?? null,
// //           isGlobal: !!a.isGlobal,
// //           canEdit: !!a.canEdit,
// //           canDelete: !!a.canDelete,
// //           updatedAt: a.updatedAt,
// //         };
// //         setArticle(mapped);

// //         // Populate form data
// //         setFormData({
// //           title: mapped.title,
// //           summary: mapped.summary || "",
// //           category: mapped.category || "",
// //           tags: mapped.tags.join(", "),
// //           readTimeMinutes: mapped.readTimeMinutes,
// //         });

// //         if (editor) {
// //           editor.commands.setContent(mapped.content || "");
// //         }
// //       } catch (error) {
// //         console.error("Error fetching article:", error);
// //       } finally {
// //         setArticleLoading(false);
// //       }
// //     };

// //     fetchArticle();
// //   }, [slug, editor]);

// //   // Ensure edit mode only if allowed
// //   useEffect(() => {
// //     if (!article || !editMode) return;
// //     if (!article.canEdit) {
// //       setEditMode(false);
// //     }
// //   }, [article, editMode]);

// //   if (loading || articleLoading) {
// //     return (
// //       <DashboardLayout user={user || undefined}>
// //         <div className="flex items-center justify-center h-96">
// //           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   if (!article) {
// //     return (
// //       <DashboardLayout user={user || undefined}>
// //         <div className="flex items-center justify-center h-96">
// //           <p className="text-muted-foreground">Article not found.</p>
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   const handleSave = async () => {
// //     if (!editor) return;
// //     setSaving(true);
// //     try {
// //       const html = editor.getHTML();

// //       // Convert comma-separated tags string back to array
// //       const tagsArray = formData.tags
// //         .split(",")
// //         .map((t) => t.trim())
// //         .filter((t) => t.length > 0);

// //       const res = await fetch(`/api/support/articles/${article.id}`, {
// //         method: "PATCH",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           content: html,
// //           title: formData.title,
// //           summary: formData.summary,
// //           category: formData.category,
// //           tags: tagsArray,
// //           readTimeMinutes: formData.readTimeMinutes,
// //         }),
// //       });
// //       const data = await res.json().catch(() => null);
// //       if (!res.ok) {
// //         console.error("Failed to save article:", data);
// //         return;
// //       }

// //       // Update local state
// //       setArticle((prev) =>
// //         prev
// //           ? {
// //               ...prev,
// //               content: html,
// //               title: formData.title,
// //               summary: formData.summary,
// //               category: formData.category,
// //               tags: tagsArray,
// //               readTimeMinutes: formData.readTimeMinutes,
// //             }
// //           : prev
// //       );
// //       setEditMode(false);
// //     } catch (error) {
// //       console.error("Save failed:", error);
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   return (
// //     <StaffAndAbove>
// //       <DashboardLayout user={user || undefined}>
// //         <div className="flex justify-end mb-4 max-w-4xl mx-auto">
// //           <div className="flex gap-2">
// //             {article.canEdit && !editMode && (
// //               <Button
// //                 size="sm"
// //                 variant="outline"
// //                 className="gap-2"
// //                 onClick={() => setEditMode(true)}
// //               >
// //                 <Pencil className="h-4 w-4" />
// //                 Edit Article
// //               </Button>
// //             )}
// //             {article.canEdit && editMode && (
// //               <>
// //                 <Button
// //                   size="sm"
// //                   variant="outline"
// //                   className="gap-2"
// //                   onClick={() => {
// //                     if (editor) {
// //                       editor.commands.setContent(article.content || "");
// //                     }
// //                     // Reset form data to original article data on cancel
// //                     setFormData({
// //                       title: article.title,
// //                       summary: article.summary || "",
// //                       category: article.category || "",
// //                       tags: article.tags.join(", "),
// //                       readTimeMinutes: article.readTimeMinutes,
// //                     });
// //                     setEditMode(false);
// //                   }}
// //                   disabled={saving}
// //                 >
// //                   <X className="h-4 w-4" />
// //                   Cancel
// //                 </Button>
// //                 <Button
// //                   size="sm"
// //                   className="gap-2"
// //                   onClick={handleSave}
// //                   disabled={saving}
// //                 >
// //                   {saving ? (
// //                     <Loader2 className="h-4 w-4 animate-spin" />
// //                   ) : (
// //                     <Save className="h-4 w-4" />
// //                   )}
// //                   Save
// //                 </Button>
// //               </>
// //             )}
// //             {user?.role === "SUPER_ADMIN" && (
// //               <Button
// //                 size="sm"
// //                 variant={article.isGlobal ? "default" : "outline"}
// //                 className="gap-2"
// //                 disabled={scopeSaving}
// //                 onClick={async () => {
// //                   setScopeSaving(true);
// //                   try {
// //                     const res = await fetch(
// //                       `/api/support/articles/${article.id}`,
// //                       {
// //                         method: "PATCH",
// //                         headers: { "Content-Type": "application/json" },
// //                         body: JSON.stringify({
// //                           isGlobal: !article.isGlobal,
// //                         }),
// //                       }
// //                     );
// //                     const data = await res.json().catch(() => null);
// //                     if (!res.ok) {
// //                       console.error("Failed to change scope:", data);
// //                       return;
// //                     }
// //                     setArticle((prev) =>
// //                       prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
// //                     );
// //                   } catch (error) {
// //                     console.error("Scope toggle failed:", error);
// //                   } finally {
// //                     setScopeSaving(false);
// //                   }
// //                 }}
// //               >
// //                 {scopeSaving ? (
// //                   <Loader2 className="h-4 w-4 animate-spin" />
// //                 ) : (
// //                   <Globe className="h-4 w-4" />
// //                 )}
// //                 {article.isGlobal ? "Global" : "Make Global"}
// //               </Button>
// //             )}
// //           </div>
// //         </div>

// //         <KBArticle
// //           title={article.title}
// //           description={article.summary || ""}
// //           category={article.category || "Uncategorized"}
// //           tags={article.tags}
// //           readTime={`${article.readTimeMinutes} min`}
// //           lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
// //           scopeLabel={
// //             article.isGlobal ? "Global article" : "Company-scoped article"
// //           }
// //         >
// //           {editMode && editor ? (
// //             <div className="space-y-6">
// //               {/* Metadata Form Fields */}
// //               <div className="grid gap-4 p-4 border rounded-lg bg-card">
// //                 <div className="grid gap-2">
// //                   <Label htmlFor="title">Article Title</Label>
// //                   <Input
// //                     id="title"
// //                     value={formData.title}
// //                     onChange={(e) =>
// //                       setFormData({ ...formData, title: e.target.value })
// //                     }
// //                   />
// //                 </div>

// //                 <div className="grid grid-cols-2 gap-4">
// //                   <div className="grid gap-2">
// //                     <Label htmlFor="category">Category</Label>
// //                     <Input
// //                       id="category"
// //                       placeholder="e.g. Getting Started"
// //                       value={formData.category}
// //                       onChange={(e) =>
// //                         setFormData({ ...formData, category: e.target.value })
// //                       }
// //                     />
// //                   </div>
// //                   <div className="grid gap-2">
// //                     <Label htmlFor="readTime">Read Time (min)</Label>
// //                     <Input
// //                       id="readTime"
// //                       type="number"
// //                       min={1}
// //                       value={formData.readTimeMinutes}
// //                       onChange={(e) =>
// //                         setFormData({
// //                           ...formData,
// //                           readTimeMinutes: parseInt(e.target.value) || 0,
// //                         })
// //                       }
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="grid gap-2">
// //                   <Label htmlFor="tags">Tags (comma separated)</Label>
// //                   <Input
// //                     id="tags"
// //                     placeholder="email, setup, guide"
// //                     value={formData.tags}
// //                     onChange={(e) =>
// //                       setFormData({ ...formData, tags: e.target.value })
// //                     }
// //                   />
// //                 </div>

// //                 <div className="grid gap-2">
// //                   <Label htmlFor="summary">Summary</Label>
// //                   <Textarea
// //                     id="summary"
// //                     placeholder="Brief description of the article..."
// //                     value={formData.summary}
// //                     onChange={(e) =>
// //                       setFormData({ ...formData, summary: e.target.value })
// //                     }
// //                   />
// //                 </div>
// //               </div>

// //               {/* The Editor */}
// //               <div className="grid gap-2">
// //                 <Label>Content</Label>
// //                 <div className="border rounded-md p-3 min-h-[400px]">
// //                   <EditorContent editor={editor} />
// //                 </div>
// //               </div>
// //             </div>
// //           ) : (
// //             <div
// //               className="prose prose-slate dark:prose-invert max-w-none"
// //               dangerouslySetInnerHTML={{ __html: article.content }}
// //             />
// //           )}
// //         </KBArticle>
// //       </DashboardLayout>
// //     </StaffAndAbove>
// //   );
// // }

// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { DashboardLayout } from "@/components/dashboard-layout";
// import { KBArticle } from "@/components/kb-article";
// import { StaffAndAbove } from "@/components/role-guard";
// import {
//   Loader2,
//   Pencil,
//   Save,
//   X,
//   Globe,
//   Bold,
//   Italic,
//   List,
//   ListOrdered,
//   Heading1,
//   Heading2,
//   Quote,
//   Undo,
//   Redo,
//   Code,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { EditorContent, useEditor, type Editor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import LinkExtension from "@tiptap/extension-link";
// import Placeholder from "@tiptap/extension-placeholder";

// // --- Types ---
// interface SupportArticle {
//   id: string;
//   title: string;
//   slug: string;
//   summary: string | null;
//   category: string | null;
//   tags: string[];
//   content: string;
//   readTimeMinutes: number;
//   authorId: string;
//   authorName: string;
//   companyId: string | null;
//   isGlobal: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
//   updatedAt: string;
// }

// // --- Editor Toolbar Component ---
// const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
//   if (!editor) return null;

//   return (
//     <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
//       <Button
//         type="button"
//         variant={
//           editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
//         }
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
//         title="Heading 1"
//       >
//         <Heading1 className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={
//           editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
//         }
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
//         title="Heading 2"
//       >
//         <Heading2 className="h-4 w-4" />
//       </Button>
//       <div className="w-px h-6 bg-border mx-1" />
//       <Button
//         type="button"
//         variant={editor.isActive("bold") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleBold().run()}
//         title="Bold"
//       >
//         <Bold className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={editor.isActive("italic") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleItalic().run()}
//         title="Italic"
//       >
//         <Italic className="h-4 w-4" />
//       </Button>
//       <div className="w-px h-6 bg-border mx-1" />
//       <Button
//         type="button"
//         variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleBulletList().run()}
//         title="Bullet List"
//       >
//         <List className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleOrderedList().run()}
//         title="Ordered List"
//       >
//         <ListOrdered className="h-4 w-4" />
//       </Button>
//       <div className="w-px h-6 bg-border mx-1" />
//       <Button
//         type="button"
//         variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleBlockquote().run()}
//         title="Quote"
//       >
//         <Quote className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleCodeBlock().run()}
//         title="Code Block"
//       >
//         <Code className="h-4 w-4" />
//       </Button>
//       <div className="flex-1" />
//       <Button
//         type="button"
//         variant="ghost"
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().undo().run()}
//         disabled={!editor.can().undo()}
//         title="Undo"
//       >
//         <Undo className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant="ghost"
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().redo().run()}
//         disabled={!editor.can().redo()}
//         title="Redo"
//       >
//         <Redo className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// };

// // --- Main Page Component ---
// export default function SupportArticlePage() {
//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const slug = params.slug as string;

//   const [user, setUser] = useState<{
//     name: string | null;
//     email: string | null;
//     image: string | null;
//     role: string;
//     id?: string;
//   } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [articleLoading, setArticleLoading] = useState(true);
//   const [article, setArticle] = useState<SupportArticle | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [scopeSaving, setScopeSaving] = useState(false);

//   // Form state for editing
//   const [formData, setFormData] = useState({
//     title: "",
//     summary: "",
//     category: "",
//     tags: "",
//     readTimeMinutes: 5,
//   });

//   const initialMode = searchParams.get("mode");
//   const [editMode, setEditMode] = useState(initialMode === "edit");

//   const editor = useEditor({
//     immediatelyRender: false,
//     extensions: [
//       StarterKit.configure({
//         heading: {
//           levels: [2, 3], // We limit headings to h2 and h3 (h1 is the title)
//         },
//       }),
//       LinkExtension.configure({
//         openOnClick: false,
//         autolink: true,
//       }),
//       Placeholder.configure({
//         placeholder: "Start writing your amazing article...",
//       }),
//     ],
//     editorProps: {
//       attributes: {
//         // This class makes the editor look like a document (Tailwind Typography)
//         class:
//           "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
//       },
//     },
//     content: "",
//   });

//   // Fetch user
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await fetch("/api/auth/me");
//         const data = await res.json();
//         if (!data?.authenticated || data?.user?.role === "GUEST") {
//           router.push("/login");
//           return;
//         }
//         setUser(data.user);
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         router.push("/login");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [router]);

//   // Fetch article by slug
//   useEffect(() => {
//     if (!slug) return;
//     const fetchArticle = async () => {
//       try {
//         const res = await fetch(
//           `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
//         );
//         const data = await res.json();
//         if (!res.ok) {
//           console.error("Failed to load article:", data);
//           return;
//         }
//         const a = data.article;
//         const mapped: SupportArticle = {
//           id: a.id,
//           title: a.title,
//           slug: a.slug,
//           summary: a.summary ?? null,
//           category: a.category ?? null,
//           tags: Array.isArray(a.tags) ? a.tags : [],
//           content: a.content,
//           readTimeMinutes: a.readTimeMinutes ?? 5,
//           authorId: a.authorId,
//           authorName: a.author?.name || a.author?.email || "Author",
//           companyId: a.companyId ?? null,
//           isGlobal: !!a.isGlobal,
//           canEdit: !!a.canEdit,
//           canDelete: !!a.canDelete,
//           updatedAt: a.updatedAt,
//         };
//         setArticle(mapped);

//         // Populate form data
//         setFormData({
//           title: mapped.title,
//           summary: mapped.summary || "",
//           category: mapped.category || "",
//           tags: mapped.tags.join(", "),
//           readTimeMinutes: mapped.readTimeMinutes,
//         });

//         if (editor) {
//           editor.commands.setContent(mapped.content || "");
//         }
//       } catch (error) {
//         console.error("Error fetching article:", error);
//       } finally {
//         setArticleLoading(false);
//       }
//     };

//     fetchArticle();
//   }, [slug, editor]);

//   // Ensure edit mode only if allowed
//   useEffect(() => {
//     if (!article || !editMode) return;
//     if (!article.canEdit) {
//       setEditMode(false);
//     }
//   }, [article, editMode]);

//   if (loading || articleLoading) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!article) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <p className="text-muted-foreground">Article not found.</p>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const handleSave = async () => {
//     if (!editor) return;
//     setSaving(true);
//     try {
//       const html = editor.getHTML();

//       // Convert comma-separated tags string back to array
//       const tagsArray = formData.tags
//         .split(",")
//         .map((t) => t.trim())
//         .filter((t) => t.length > 0);

//       const res = await fetch(`/api/support/articles/${article.id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           content: html,
//           title: formData.title,
//           summary: formData.summary,
//           category: formData.category,
//           tags: tagsArray,
//           readTimeMinutes: formData.readTimeMinutes,
//         }),
//       });
//       const data = await res.json().catch(() => null);
//       if (!res.ok) {
//         console.error("Failed to save article:", data);
//         return;
//       }

//       // Update local state
//       setArticle((prev) =>
//         prev
//           ? {
//               ...prev,
//               content: html,
//               title: formData.title,
//               summary: formData.summary,
//               category: formData.category,
//               tags: tagsArray,
//               readTimeMinutes: formData.readTimeMinutes,
//             }
//           : prev
//       );
//       setEditMode(false);
//     } catch (error) {
//       console.error("Save failed:", error);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <StaffAndAbove>
//       <DashboardLayout user={user || undefined}>
//         <div className="flex justify-end mb-4 max-w-4xl mx-auto">
//           <div className="flex gap-2">
//             {article.canEdit && !editMode && (
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="gap-2"
//                 onClick={() => setEditMode(true)}
//               >
//                 <Pencil className="h-4 w-4" />
//                 Edit Article
//               </Button>
//             )}
//             {article.canEdit && editMode && (
//               <>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="gap-2"
//                   onClick={() => {
//                     if (editor) {
//                       editor.commands.setContent(article.content || "");
//                     }
//                     // Reset form data to original article data on cancel
//                     setFormData({
//                       title: article.title,
//                       summary: article.summary || "",
//                       category: article.category || "",
//                       tags: article.tags.join(", "),
//                       readTimeMinutes: article.readTimeMinutes,
//                     });
//                     setEditMode(false);
//                   }}
//                   disabled={saving}
//                 >
//                   <X className="h-4 w-4" />
//                   Cancel
//                 </Button>
//                 <Button
//                   size="sm"
//                   className="gap-2"
//                   onClick={handleSave}
//                   disabled={saving}
//                 >
//                   {saving ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Save className="h-4 w-4" />
//                   )}
//                   Save
//                 </Button>
//               </>
//             )}
//             {user?.role === "SUPER_ADMIN" && (
//               <Button
//                 size="sm"
//                 variant={article.isGlobal ? "default" : "outline"}
//                 className="gap-2"
//                 disabled={scopeSaving}
//                 onClick={async () => {
//                   setScopeSaving(true);
//                   try {
//                     const res = await fetch(
//                       `/api/support/articles/${article.id}`,
//                       {
//                         method: "PATCH",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({
//                           isGlobal: !article.isGlobal,
//                         }),
//                       }
//                     );
//                     const data = await res.json().catch(() => null);
//                     if (!res.ok) {
//                       console.error("Failed to change scope:", data);
//                       return;
//                     }
//                     setArticle((prev) =>
//                       prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
//                     );
//                   } catch (error) {
//                     console.error("Scope toggle failed:", error);
//                   } finally {
//                     setScopeSaving(false);
//                   }
//                 }}
//               >
//                 {scopeSaving ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Globe className="h-4 w-4" />
//                 )}
//                 {article.isGlobal ? "Global" : "Make Global"}
//               </Button>
//             )}
//           </div>
//         </div>

//         <KBArticle
//           title={article.title}
//           description={article.summary || ""}
//           category={article.category || "Uncategorized"}
//           tags={article.tags}
//           readTime={`${article.readTimeMinutes} min`}
//           lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
//           scopeLabel={
//             article.isGlobal ? "Global article" : "Company-scoped article"
//           }
//         >
//           {editMode && editor ? (
//             <div className="space-y-6">
//               {/* Metadata Form Fields */}
//               <div className="grid gap-4 p-4 border rounded-lg bg-card">
//                 <div className="grid gap-2">
//                   <Label htmlFor="title">Article Title</Label>
//                   <Input
//                     id="title"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData({ ...formData, title: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="category">Category</Label>
//                     <Input
//                       id="category"
//                       placeholder="e.g. Getting Started"
//                       value={formData.category}
//                       onChange={(e) =>
//                         setFormData({ ...formData, category: e.target.value })
//                       }
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="readTime">Read Time (min)</Label>
//                     <Input
//                       id="readTime"
//                       type="number"
//                       min={1}
//                       value={formData.readTimeMinutes}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           readTimeMinutes: parseInt(e.target.value) || 0,
//                         })
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="tags">Tags (comma separated)</Label>
//                   <Input
//                     id="tags"
//                     placeholder="email, setup, guide"
//                     value={formData.tags}
//                     onChange={(e) =>
//                       setFormData({ ...formData, tags: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="summary">Summary</Label>
//                   <Textarea
//                     id="summary"
//                     placeholder="Brief description of the article..."
//                     value={formData.summary}
//                     onChange={(e) =>
//                       setFormData({ ...formData, summary: e.target.value })
//                     }
//                   />
//                 </div>
//               </div>

//               {/* The Editor with Toolbar */}
//               <div className="grid gap-2">
//                 <Label>Content</Label>
//                 <div className="border rounded-md overflow-hidden bg-background">
//                   <EditorToolbar editor={editor} />
//                   <EditorContent editor={editor} />
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div
//               className="prose prose-slate dark:prose-invert max-w-none"
//               dangerouslySetInnerHTML={{ __html: article.content }}
//             />
//           )}
//         </KBArticle>
//       </DashboardLayout>
//     </StaffAndAbove>
//   );
// }

// quill setup

// "use client";

// import { useEffect, useState, useMemo } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import dynamic from "next/dynamic"; // Required for Quill
// import { DashboardLayout } from "@/components/dashboard-layout";
// import { KBArticle } from "@/components/kb-article";
// import { StaffAndAbove } from "@/components/role-guard";
// import { Loader2, Pencil, Save, X, Globe } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";

// // Import Quill Styles
// import "react-quill-new/dist/quill.snow.css";

// // Dynamically import ReactQuill to prevent SSR errors
// const ReactQuill = dynamic(() => import("react-quill-new"), {
//   ssr: false,
//   loading: () => <div className="h-64 bg-muted animate-pulse rounded-md" />,
// });

// // --- Types ---
// interface SupportArticle {
//   id: string;
//   title: string;
//   slug: string;
//   summary: string | null;
//   category: string | null;
//   tags: string[];
//   content: string;
//   readTimeMinutes: number;
//   authorId: string;
//   authorName: string;
//   companyId: string | null;
//   isGlobal: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
//   updatedAt: string;
// }

// // --- Main Page Component ---
// export default function SupportArticlePage() {
//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const slug = params.slug as string;

//   const [user, setUser] = useState<{
//     name: string | null;
//     email: string | null;
//     image: string | null;
//     role: string;
//     id?: string;
//   } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [articleLoading, setArticleLoading] = useState(true);
//   const [article, setArticle] = useState<SupportArticle | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [scopeSaving, setScopeSaving] = useState(false);

//   // Form state for editing
//   const [formData, setFormData] = useState({
//     title: "",
//     summary: "",
//     category: "",
//     tags: "",
//     readTimeMinutes: 5,
//   });

//   // Editor Content State
//   const [editorContent, setEditorContent] = useState("");

//   const initialMode = searchParams.get("mode");
//   const [editMode, setEditMode] = useState(initialMode === "edit");

//   // Quill Modules Configuration (The Toolbar)
//   const modules = useMemo(
//     () => ({
//       toolbar: [
//         [{ header: [1, 2, 3, false] }],
//         ["bold", "italic", "underline", "strike", "blockquote"],
//         [
//           { list: "ordered" },
//           { list: "bullet" },
//           { indent: "-1" },
//           { indent: "+1" },
//         ],
//         ["link", "image"],
//         ["clean"],
//       ],
//     }),
//     []
//   );

//   // Fetch user
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await fetch("/api/auth/me");
//         const data = await res.json();
//         if (!data?.authenticated || data?.user?.role === "GUEST") {
//           router.push("/login");
//           return;
//         }
//         setUser(data.user);
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         router.push("/login");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [router]);

//   // Fetch article by slug
//   useEffect(() => {
//     if (!slug) return;
//     const fetchArticle = async () => {
//       try {
//         const res = await fetch(
//           `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
//         );
//         const data = await res.json();
//         if (!res.ok) {
//           console.error("Failed to load article:", data);
//           return;
//         }
//         const a = data.article;
//         const mapped: SupportArticle = {
//           id: a.id,
//           title: a.title,
//           slug: a.slug,
//           summary: a.summary ?? null,
//           category: a.category ?? null,
//           tags: Array.isArray(a.tags) ? a.tags : [],
//           content: a.content,
//           readTimeMinutes: a.readTimeMinutes ?? 5,
//           authorId: a.authorId,
//           authorName: a.author?.name || a.author?.email || "Author",
//           companyId: a.companyId ?? null,
//           isGlobal: !!a.isGlobal,
//           canEdit: !!a.canEdit,
//           canDelete: !!a.canDelete,
//           updatedAt: a.updatedAt,
//         };
//         setArticle(mapped);

//         // Populate form data
//         setFormData({
//           title: mapped.title,
//           summary: mapped.summary || "",
//           category: mapped.category || "",
//           tags: mapped.tags.join(", "),
//           readTimeMinutes: mapped.readTimeMinutes,
//         });

//         setEditorContent(mapped.content || "");
//       } catch (error) {
//         console.error("Error fetching article:", error);
//       } finally {
//         setArticleLoading(false);
//       }
//     };

//     fetchArticle();
//   }, [slug]);

//   // Ensure edit mode only if allowed
//   useEffect(() => {
//     if (!article || !editMode) return;
//     if (!article.canEdit) {
//       setEditMode(false);
//     }
//   }, [article, editMode]);

//   if (loading || articleLoading) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!article) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <p className="text-muted-foreground">Article not found.</p>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const handleSave = async () => {
//     setSaving(true);
//     try {
//       // Convert comma-separated tags string back to array
//       const tagsArray = formData.tags
//         .split(",")
//         .map((t) => t.trim())
//         .filter((t) => t.length > 0);

//       const res = await fetch(`/api/support/articles/${article.id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           content: editorContent,
//           title: formData.title,
//           summary: formData.summary,
//           category: formData.category,
//           tags: tagsArray,
//           readTimeMinutes: formData.readTimeMinutes,
//         }),
//       });
//       const data = await res.json().catch(() => null);
//       if (!res.ok) {
//         console.error("Failed to save article:", data);
//         return;
//       }

//       // Update local state
//       setArticle((prev) =>
//         prev
//           ? {
//               ...prev,
//               content: editorContent,
//               title: formData.title,
//               summary: formData.summary,
//               category: formData.category,
//               tags: tagsArray,
//               readTimeMinutes: formData.readTimeMinutes,
//             }
//           : prev
//       );
//       setEditMode(false);
//     } catch (error) {
//       console.error("Save failed:", error);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <StaffAndAbove>
//       <DashboardLayout user={user || undefined}>
//         <div className="flex justify-end mb-4 max-w-4xl mx-auto">
//           <div className="flex gap-2">
//             {article.canEdit && !editMode && (
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="gap-2"
//                 onClick={() => setEditMode(true)}
//               >
//                 <Pencil className="h-4 w-4" />
//                 Edit Article
//               </Button>
//             )}
//             {article.canEdit && editMode && (
//               <>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="gap-2"
//                   onClick={() => {
//                     // Reset form data to original article data on cancel
//                     setFormData({
//                       title: article.title,
//                       summary: article.summary || "",
//                       category: article.category || "",
//                       tags: article.tags.join(", "),
//                       readTimeMinutes: article.readTimeMinutes,
//                     });
//                     setEditorContent(article.content || "");
//                     setEditMode(false);
//                   }}
//                   disabled={saving}
//                 >
//                   <X className="h-4 w-4" />
//                   Cancel
//                 </Button>
//                 <Button
//                   size="sm"
//                   className="gap-2"
//                   onClick={handleSave}
//                   disabled={saving}
//                 >
//                   {saving ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Save className="h-4 w-4" />
//                   )}
//                   Save
//                 </Button>
//               </>
//             )}
//             {user?.role === "SUPER_ADMIN" && (
//               <Button
//                 size="sm"
//                 variant={article.isGlobal ? "default" : "outline"}
//                 className="gap-2"
//                 disabled={scopeSaving}
//                 onClick={async () => {
//                   setScopeSaving(true);
//                   try {
//                     const res = await fetch(
//                       `/api/support/articles/${article.id}`,
//                       {
//                         method: "PATCH",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({
//                           isGlobal: !article.isGlobal,
//                         }),
//                       }
//                     );
//                     const data = await res.json().catch(() => null);
//                     if (!res.ok) {
//                       console.error("Failed to change scope:", data);
//                       return;
//                     }
//                     setArticle((prev) =>
//                       prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
//                     );
//                   } catch (error) {
//                     console.error("Scope toggle failed:", error);
//                   } finally {
//                     setScopeSaving(false);
//                   }
//                 }}
//               >
//                 {scopeSaving ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Globe className="h-4 w-4" />
//                 )}
//                 {article.isGlobal ? "Global" : "Make Global"}
//               </Button>
//             )}
//           </div>
//         </div>

//         <KBArticle
//           title={article.title}
//           description={article.summary || ""}
//           category={article.category || "Uncategorized"}
//           tags={article.tags}
//           readTime={`${article.readTimeMinutes} min`}
//           lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
//           scopeLabel={
//             article.isGlobal ? "Global article" : "Company-scoped article"
//           }
//         >
//           {editMode ? (
//             <div className="space-y-6">
//               {/* Metadata Form Fields */}
//               <div className="grid gap-4 p-4 border rounded-lg bg-card">
//                 <div className="grid gap-2">
//                   <Label htmlFor="title">Article Title</Label>
//                   <Input
//                     id="title"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData({ ...formData, title: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="category">Category</Label>
//                     <Input
//                       id="category"
//                       placeholder="e.g. Getting Started"
//                       value={formData.category}
//                       onChange={(e) =>
//                         setFormData({ ...formData, category: e.target.value })
//                       }
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="readTime">Read Time (min)</Label>
//                     <Input
//                       id="readTime"
//                       type="number"
//                       min={1}
//                       value={formData.readTimeMinutes}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           readTimeMinutes: parseInt(e.target.value) || 0,
//                         })
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="tags">Tags (comma separated)</Label>
//                   <Input
//                     id="tags"
//                     placeholder="email, setup, guide"
//                     value={formData.tags}
//                     onChange={(e) =>
//                       setFormData({ ...formData, tags: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="summary">Summary</Label>
//                   <Textarea
//                     id="summary"
//                     placeholder="Brief description of the article..."
//                     value={formData.summary}
//                     onChange={(e) =>
//                       setFormData({ ...formData, summary: e.target.value })
//                     }
//                   />
//                 </div>
//               </div>

//               {/* Quill Editor */}
//               <div className="grid gap-2">
//                 <Label>Content</Label>
//                 <div className="bg-background">
//                   <ReactQuill
//                     theme="snow"
//                     value={editorContent}
//                     onChange={setEditorContent}
//                     modules={modules}
//                     className="h-[400px] mb-12" // mb-12 handles the toolbar height offset
//                   />
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div
//               className="prose prose-slate dark:prose-invert max-w-none ql-editor p-0"
//               dangerouslySetInnerHTML={{ __html: article.content }}
//             />
//           )}
//         </KBArticle>
//       </DashboardLayout>
//     </StaffAndAbove>
//   );
// }

// tip tap enhanced with custom toolbar

// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { DashboardLayout } from "@/components/dashboard-layout";
// import { KBArticle } from "@/components/kb-article";
// import { StaffAndAbove } from "@/components/role-guard";
// import {
//   Loader2,
//   Pencil,
//   Save,
//   X,
//   Globe,
//   Bold,
//   Italic,
//   List,
//   ListOrdered,
//   Heading1,
//   Heading2,
//   Quote,
//   Undo,
//   Redo,
//   Code,
//   FileCode, // Icon for Source Code
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { EditorContent, useEditor, type Editor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import LinkExtension from "@tiptap/extension-link";
// import Placeholder from "@tiptap/extension-placeholder";
// import CodeBlock from "@tiptap/extension-code-block";

// // --- Types ---
// interface SupportArticle {
//   id: string;
//   title: string;
//   slug: string;
//   summary: string | null;
//   category: string | null;
//   tags: string[];
//   content: string;
//   readTimeMinutes: number;
//   authorId: string;
//   authorName: string;
//   companyId: string | null;
//   isGlobal: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
//   updatedAt: string;
// }

// // --- Editor Toolbar Component ---
// const EditorToolbar = ({
//   editor,
//   showSource,
//   setShowSource,
// }: {
//   editor: Editor | null;
//   showSource: boolean;
//   setShowSource: (v: boolean) => void;
// }) => {
//   if (!editor) return null;

//   return (
//     <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
//       {/* Headings */}
//       <Button
//         type="button"
//         variant={
//           editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
//         }
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
//         disabled={showSource}
//         title="Heading 2"
//       >
//         <Heading1 className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={
//           editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
//         }
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
//         disabled={showSource}
//         title="Heading 3"
//       >
//         <Heading2 className="h-4 w-4" />
//       </Button>

//       <div className="w-px h-6 bg-border mx-1" />

//       {/* Formatting */}
//       <Button
//         type="button"
//         variant={editor.isActive("bold") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleBold().run()}
//         disabled={showSource}
//         title="Bold"
//       >
//         <Bold className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={editor.isActive("italic") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleItalic().run()}
//         disabled={showSource}
//         title="Italic"
//       >
//         <Italic className="h-4 w-4" />
//       </Button>

//       <div className="w-px h-6 bg-border mx-1" />

//       {/* Lists */}
//       <Button
//         type="button"
//         variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleBulletList().run()}
//         disabled={showSource}
//         title="Bullet List"
//       >
//         <List className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleOrderedList().run()}
//         disabled={showSource}
//         title="Ordered List"
//       >
//         <ListOrdered className="h-4 w-4" />
//       </Button>

//       <div className="w-px h-6 bg-border mx-1" />

//       {/* Code Features */}
//       <Button
//         type="button"
//         variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleCodeBlock().run()}
//         disabled={showSource}
//         title="Code Block"
//       >
//         <Code className="h-4 w-4" />
//       </Button>

//       <Button
//         type="button"
//         variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().toggleBlockquote().run()}
//         disabled={showSource}
//         title="Quote"
//       >
//         <Quote className="h-4 w-4" />
//       </Button>

//       <div className="flex-1" />

//       {/* Source Code Toggle */}
//       <Button
//         type="button"
//         variant={showSource ? "default" : "outline"}
//         size="sm"
//         className="h-8 px-2 gap-2 text-xs"
//         onClick={() => setShowSource(!showSource)}
//         title="View Source HTML"
//       >
//         <FileCode className="h-4 w-4" />
//         <span className="sr-only sm:not-sr-only sm:inline-block">Source</span>
//       </Button>

//       <div className="w-px h-6 bg-border mx-1" />

//       {/* History */}
//       <Button
//         type="button"
//         variant="ghost"
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().undo().run()}
//         disabled={!editor.can().undo() || showSource}
//         title="Undo"
//       >
//         <Undo className="h-4 w-4" />
//       </Button>
//       <Button
//         type="button"
//         variant="ghost"
//         size="sm"
//         className="h-8 w-8 p-0"
//         onClick={() => editor.chain().focus().redo().run()}
//         disabled={!editor.can().redo() || showSource}
//         title="Redo"
//       >
//         <Redo className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// };

// // --- Main Page Component ---
// export default function SupportArticlePage() {
//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const slug = params.slug as string;

//   const [user, setUser] = useState<{
//     name: string | null;
//     email: string | null;
//     image: string | null;
//     role: string;
//     id?: string;
//   } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [articleLoading, setArticleLoading] = useState(true);
//   const [article, setArticle] = useState<SupportArticle | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [scopeSaving, setScopeSaving] = useState(false);

//   // Form state for editing
//   const [formData, setFormData] = useState({
//     title: "",
//     summary: "",
//     category: "",
//     tags: "",
//     readTimeMinutes: 5,
//   });

//   // Source Code Mode State
//   const [showSource, setShowSource] = useState(false);
//   const [sourceHtml, setSourceHtml] = useState("");

//   const initialMode = searchParams.get("mode");
//   const [editMode, setEditMode] = useState(initialMode === "edit");

//   const editor = useEditor({
//     immediatelyRender: false,
//     extensions: [
//       StarterKit.configure({
//         heading: {
//           levels: [2, 3],
//         },
//         codeBlock: false, // Disable default to use the extension below
//       }),
//       CodeBlock, // Adds Code Block functionality
//       LinkExtension.configure({
//         openOnClick: false,
//         autolink: true,
//       }),
//       Placeholder.configure({
//         placeholder: "Start writing your amazing article...",
//       }),
//     ],
//     editorProps: {
//       attributes: {
//         class:
//           "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
//       },
//     },
//     content: "",
//     onUpdate: ({ editor }) => {
//       // Keep source HTML in sync when typing in visual mode
//       setSourceHtml(editor.getHTML());
//     },
//   });

//   // Fetch user
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await fetch("/api/auth/me");
//         const data = await res.json();
//         if (!data?.authenticated || data?.user?.role === "GUEST") {
//           router.push("/login");
//           return;
//         }
//         setUser(data.user);
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         router.push("/login");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [router]);

//   // Fetch article by slug
//   useEffect(() => {
//     if (!slug) return;
//     const fetchArticle = async () => {
//       try {
//         const res = await fetch(
//           `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
//         );
//         const data = await res.json();
//         if (!res.ok) {
//           console.error("Failed to load article:", data);
//           return;
//         }
//         const a = data.article;
//         const mapped: SupportArticle = {
//           id: a.id,
//           title: a.title,
//           slug: a.slug,
//           summary: a.summary ?? null,
//           category: a.category ?? null,
//           tags: Array.isArray(a.tags) ? a.tags : [],
//           content: a.content,
//           readTimeMinutes: a.readTimeMinutes ?? 5,
//           authorId: a.authorId,
//           authorName: a.author?.name || a.author?.email || "Author",
//           companyId: a.companyId ?? null,
//           isGlobal: !!a.isGlobal,
//           canEdit: !!a.canEdit,
//           canDelete: !!a.canDelete,
//           updatedAt: a.updatedAt,
//         };
//         setArticle(mapped);

//         // Populate form data
//         setFormData({
//           title: mapped.title,
//           summary: mapped.summary || "",
//           category: mapped.category || "",
//           tags: mapped.tags.join(", "),
//           readTimeMinutes: mapped.readTimeMinutes,
//         });

//         // Initialize editor
//         setSourceHtml(mapped.content || "");
//         if (editor) {
//           editor.commands.setContent(mapped.content || "");
//         }
//       } catch (error) {
//         console.error("Error fetching article:", error);
//       } finally {
//         setArticleLoading(false);
//       }
//     };

//     fetchArticle();
//   }, [slug, editor]);

//   // Ensure edit mode only if allowed
//   useEffect(() => {
//     if (!article || !editMode) return;
//     if (!article.canEdit) {
//       setEditMode(false);
//     }
//   }, [article, editMode]);

//   // Handle Source Code Toggle
//   const handleSourceToggle = (show: boolean) => {
//     if (!editor) return;
//     if (show) {
//       // Switching TO Source Mode: Get latest HTML from editor
//       setSourceHtml(editor.getHTML());
//     } else {
//       // Switching BACK to Visual Mode: Update editor with HTML from textarea
//       editor.commands.setContent(sourceHtml);
//     }
//     setShowSource(show);
//   };

//   if (loading || articleLoading) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!article) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <p className="text-muted-foreground">Article not found.</p>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const handleSave = async () => {
//     if (!editor) return;
//     setSaving(true);
//     try {
//       // If we are in source mode, use the textarea content, otherwise use editor content
//       const finalContent = showSource ? sourceHtml : editor.getHTML();

//       const tagsArray = formData.tags
//         .split(",")
//         .map((t) => t.trim())
//         .filter((t) => t.length > 0);

//       const res = await fetch(`/api/support/articles/${article.id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           content: finalContent,
//           title: formData.title,
//           summary: formData.summary,
//           category: formData.category,
//           tags: tagsArray,
//           readTimeMinutes: formData.readTimeMinutes,
//         }),
//       });
//       const data = await res.json().catch(() => null);
//       if (!res.ok) {
//         console.error("Failed to save article:", data);
//         return;
//       }

//       setArticle((prev) =>
//         prev
//           ? {
//               ...prev,
//               content: finalContent,
//               title: formData.title,
//               summary: formData.summary,
//               category: formData.category,
//               tags: tagsArray,
//               readTimeMinutes: formData.readTimeMinutes,
//             }
//           : prev
//       );
//       setEditMode(false);
//       setShowSource(false); // Reset view
//     } catch (error) {
//       console.error("Save failed:", error);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <StaffAndAbove>
//       <DashboardLayout user={user || undefined}>
//         <div className="flex justify-end mb-4 max-w-4xl mx-auto">
//           <div className="flex gap-2">
//             {article.canEdit && !editMode && (
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="gap-2"
//                 onClick={() => setEditMode(true)}
//               >
//                 <Pencil className="h-4 w-4" />
//                 Edit Article
//               </Button>
//             )}
//             {article.canEdit && editMode && (
//               <>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="gap-2"
//                   onClick={() => {
//                     if (editor) {
//                       editor.commands.setContent(article.content || "");
//                     }
//                     setFormData({
//                       title: article.title,
//                       summary: article.summary || "",
//                       category: article.category || "",
//                       tags: article.tags.join(", "),
//                       readTimeMinutes: article.readTimeMinutes,
//                     });
//                     setEditMode(false);
//                     setShowSource(false);
//                   }}
//                   disabled={saving}
//                 >
//                   <X className="h-4 w-4" />
//                   Cancel
//                 </Button>
//                 <Button
//                   size="sm"
//                   className="gap-2"
//                   onClick={handleSave}
//                   disabled={saving}
//                 >
//                   {saving ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Save className="h-4 w-4" />
//                   )}
//                   Save
//                 </Button>
//               </>
//             )}
//             {user?.role === "SUPER_ADMIN" && (
//               <Button
//                 size="sm"
//                 variant={article.isGlobal ? "default" : "outline"}
//                 className="gap-2"
//                 disabled={scopeSaving}
//                 onClick={async () => {
//                   setScopeSaving(true);
//                   try {
//                     const res = await fetch(
//                       `/api/support/articles/${article.id}`,
//                       {
//                         method: "PATCH",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({
//                           isGlobal: !article.isGlobal,
//                         }),
//                       }
//                     );
//                     const data = await res.json().catch(() => null);
//                     if (!res.ok) {
//                       console.error("Failed to change scope:", data);
//                       return;
//                     }
//                     setArticle((prev) =>
//                       prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
//                     );
//                   } catch (error) {
//                     console.error("Scope toggle failed:", error);
//                   } finally {
//                     setScopeSaving(false);
//                   }
//                 }}
//               >
//                 {scopeSaving ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Globe className="h-4 w-4" />
//                 )}
//                 {article.isGlobal ? "Global" : "Make Global"}
//               </Button>
//             )}
//           </div>
//         </div>

//         <KBArticle
//           title={article.title}
//           description={article.summary || ""}
//           category={article.category || "Uncategorized"}
//           tags={article.tags}
//           readTime={`${article.readTimeMinutes} min`}
//           lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
//           scopeLabel={
//             article.isGlobal ? "Global article" : "Company-scoped article"
//           }
//         >
//           {editMode && editor ? (
//             <div className="space-y-6">
//               {/* Metadata Form Fields */}
//               <div className="grid gap-4 p-4 border rounded-lg bg-card">
//                 <div className="grid gap-2">
//                   <Label htmlFor="title">Article Title</Label>
//                   <Input
//                     id="title"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData({ ...formData, title: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="category">Category</Label>
//                     <Input
//                       id="category"
//                       placeholder="e.g. Getting Started"
//                       value={formData.category}
//                       onChange={(e) =>
//                         setFormData({ ...formData, category: e.target.value })
//                       }
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="readTime">Read Time (min)</Label>
//                     <Input
//                       id="readTime"
//                       type="number"
//                       min={1}
//                       value={formData.readTimeMinutes}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           readTimeMinutes: parseInt(e.target.value) || 0,
//                         })
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="tags">Tags (comma separated)</Label>
//                   <Input
//                     id="tags"
//                     placeholder="email, setup, guide"
//                     value={formData.tags}
//                     onChange={(e) =>
//                       setFormData({ ...formData, tags: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="summary">Summary</Label>
//                   <Textarea
//                     id="summary"
//                     placeholder="Brief description of the article..."
//                     value={formData.summary}
//                     onChange={(e) =>
//                       setFormData({ ...formData, summary: e.target.value })
//                     }
//                   />
//                 </div>
//               </div>

//               {/* The Editor with Toolbar */}
//               <div className="grid gap-2">
//                 <Label>Content</Label>
//                 <div className="border rounded-md overflow-hidden bg-background">
//                   <EditorToolbar
//                     editor={editor}
//                     showSource={showSource}
//                     setShowSource={handleSourceToggle}
//                   />
//                   {showSource ? (
//                     <Textarea
//                       value={sourceHtml}
//                       onChange={(e) => setSourceHtml(e.target.value)}
//                       className="min-h-[400px] font-mono text-sm border-0 focus-visible:ring-0 rounded-none resize-y p-4"
//                       placeholder="Enter raw HTML here..."
//                     />
//                   ) : (
//                     <EditorContent editor={editor} />
//                   )}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div
//               className="prose prose-slate dark:prose-invert max-w-none"
//               dangerouslySetInnerHTML={{ __html: article.content }}
//             />
//           )}
//         </KBArticle>
//       </DashboardLayout>
//     </StaffAndAbove>
//   );
// }

// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { DashboardLayout } from "@/components/dashboard-layout";
// import { KBArticle } from "@/components/kb-article";
// import { StaffAndAbove } from "@/components/role-guard";
// import {
//   Loader2,
//   Pencil,
//   Save,
//   X,
//   Globe,
//   Bold,
//   Italic,
//   Underline as UnderlineIcon,
//   List,
//   ListOrdered,
//   Heading1,
//   Heading2,
//   Quote,
//   Undo,
//   Redo,
//   Code,
//   FileCode,
//   Link as LinkIcon,
//   Image as ImageIcon,
//   AlignLeft,
//   AlignCenter,
//   AlignRight,
//   AlignJustify,
//   Printer,
//   Copy,
//   Minus,
//   Upload,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { EditorContent, useEditor, type Editor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import LinkExtension from "@tiptap/extension-link";
// import ImageExtension from "@tiptap/extension-image";
// import UnderlineExtension from "@tiptap/extension-underline";
// import TextAlignExtension from "@tiptap/extension-text-align";
// import Placeholder from "@tiptap/extension-placeholder";
// import CodeBlock from "@tiptap/extension-code-block";
// import { toast } from "sonner";

// // --- Helper: Convert File to Base64 ---
// const fileToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = (error) => reject(error);
//   });
// };

// // --- Types ---
// interface SupportArticle {
//   id: string;
//   title: string;
//   slug: string;
//   summary: string | null;
//   category: string | null;
//   tags: string[];
//   content: string;
//   featuredImage: string | null;
//   readTimeMinutes: number;
//   authorId: string;
//   authorName: string;
//   companyId: string | null;
//   isGlobal: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
//   updatedAt: string;
// }

// // --- Editor Toolbar Component ---
// const EditorToolbar = ({
//   editor,
//   showSource,
//   setShowSource,
// }: {
//   editor: Editor | null;
//   showSource: boolean;
//   setShowSource: (v: boolean) => void;
// }) => {
//   // Hidden input ref for editor images
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Modal State for Links
//   const [linkModalOpen, setLinkModalOpen] = useState(false);
//   const [linkValue, setLinkValue] = useState("");

//   if (!editor) return null;

//   const openLinkModal = () => {
//     const previousUrl = editor.getAttributes("link").href;
//     setLinkValue(previousUrl || "");
//     setLinkModalOpen(true);
//   };

//   const handleLinkSubmit = () => {
//     if (linkValue === "") {
//       editor.chain().focus().extendMarkRange("link").unsetLink().run();
//     } else {
//       editor
//         .chain()
//         .focus()
//         .extendMarkRange("link")
//         .setLink({ href: linkValue })
//         .run();
//     }
//     setLinkModalOpen(false);
//   };

//   // Trigger the hidden file input
//   const handleImageClick = () => {
//     fileInputRef.current?.click();
//   };

//   // Handle file selection for Editor Content
//   const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       try {
//         const base64 = await fileToBase64(file);
//         editor.chain().focus().setImage({ src: base64 }).run();
//       } catch (error) {
//         console.error("Error converting image:", error);
//         toast.error("Failed to upload image");
//       }
//     }
//     // Reset input so same file can be selected again if needed
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleCopy = () => {
//     const content = editor.getText();
//     navigator.clipboard.writeText(content);
//     toast.success("Content copied to clipboard");
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <>
//       {/* Hidden File Input for Editor Images */}
//       <input
//         type="file"
//         ref={fileInputRef}
//         className="hidden"
//         accept="image/*"
//         onChange={onFileChange}
//       />

//       <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
//         {/* History & Utils */}
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().undo().run()}
//           disabled={!editor.can().undo() || showSource}
//           title="Undo"
//         >
//           <Undo className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().redo().run()}
//           disabled={!editor.can().redo() || showSource}
//           title="Redo"
//         >
//           <Redo className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={handlePrint}
//           title="Print"
//         >
//           <Printer className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={handleCopy}
//           title="Copy Text"
//         >
//           <Copy className="h-4 w-4" />
//         </Button>

//         <div className="w-px h-6 bg-border mx-1" />

//         {/* Headings */}
//         <Button
//           type="button"
//           variant={
//             editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
//           }
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() =>
//             editor.chain().focus().toggleHeading({ level: 2 }).run()
//           }
//           disabled={showSource}
//           title="Heading 2"
//         >
//           <Heading1 className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={
//             editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
//           }
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() =>
//             editor.chain().focus().toggleHeading({ level: 3 }).run()
//           }
//           disabled={showSource}
//           title="Heading 3"
//         >
//           <Heading2 className="h-4 w-4" />
//         </Button>

//         <div className="w-px h-6 bg-border mx-1" />

//         {/* Formatting */}
//         <Button
//           type="button"
//           variant={editor.isActive("bold") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleBold().run()}
//           disabled={showSource}
//           title="Bold"
//         >
//           <Bold className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={editor.isActive("italic") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//           disabled={showSource}
//           title="Italic"
//         >
//           <Italic className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={editor.isActive("underline") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleUnderline().run()}
//           disabled={showSource}
//           title="Underline"
//         >
//           <UnderlineIcon className="h-4 w-4" />
//         </Button>

//         <div className="w-px h-6 bg-border mx-1" />

//         {/* Alignment */}
//         <Button
//           type="button"
//           variant={
//             editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"
//           }
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().setTextAlign("left").run()}
//           disabled={showSource}
//           title="Align Left"
//         >
//           <AlignLeft className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={
//             editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
//           }
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().setTextAlign("center").run()}
//           disabled={showSource}
//           title="Align Center"
//         >
//           <AlignCenter className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={
//             editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
//           }
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().setTextAlign("right").run()}
//           disabled={showSource}
//           title="Align Right"
//         >
//           <AlignRight className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={
//             editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"
//           }
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().setTextAlign("justify").run()}
//           disabled={showSource}
//           title="Justify"
//         >
//           <AlignJustify className="h-4 w-4" />
//         </Button>

//         <div className="w-px h-6 bg-border mx-1" />

//         {/* Lists & Quotes */}
//         <Button
//           type="button"
//           variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleBulletList().run()}
//           disabled={showSource}
//           title="Bullet List"
//         >
//           <List className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleOrderedList().run()}
//           disabled={showSource}
//           title="Ordered List"
//         >
//           <ListOrdered className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleBlockquote().run()}
//           disabled={showSource}
//           title="Quote"
//         >
//           <Quote className="h-4 w-4" />
//         </Button>

//         <div className="w-px h-6 bg-border mx-1" />

//         {/* Inserts */}
//         <Button
//           type="button"
//           variant={editor.isActive("link") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={openLinkModal}
//           disabled={showSource}
//           title="Link"
//         >
//           <LinkIcon className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={handleImageClick}
//           disabled={showSource}
//           title="Upload Image"
//         >
//           <ImageIcon className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().setHorizontalRule().run()}
//           disabled={showSource}
//           title="Horizontal Line"
//         >
//           <Minus className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
//           size="sm"
//           className="h-8 w-8 p-0"
//           onClick={() => editor.chain().focus().toggleCodeBlock().run()}
//           disabled={showSource}
//           title="Code Block"
//         >
//           <Code className="h-4 w-4" />
//         </Button>

//         <div className="flex-1" />

//         {/* Source Toggle */}
//         <Button
//           type="button"
//           variant={showSource ? "default" : "outline"}
//           size="sm"
//           className="h-8 px-2 gap-2 text-xs"
//           onClick={() => setShowSource(!showSource)}
//           title="View Source HTML"
//         >
//           <FileCode className="h-4 w-4" />
//           <span className="sr-only sm:not-sr-only sm:inline-block">Source</span>
//         </Button>
//       </div>

//       {/* LINK MODAL */}
//       {linkModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
//           <div className="w-full max-w-md bg-background border rounded-lg shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold">Insert Link</h3>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-6 w-6"
//                 onClick={() => setLinkModalOpen(false)}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="url-input">URL</Label>
//               <Input
//                 id="url-input"
//                 placeholder="https://example.com"
//                 value={linkValue}
//                 onChange={(e) => setLinkValue(e.target.value)}
//                 autoFocus
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") handleLinkSubmit();
//                 }}
//               />
//             </div>

//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleLinkSubmit}>Save Link</Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// // --- Main Page Component ---
// export default function SupportArticlePage() {
//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const slug = params.slug as string;

//   const [user, setUser] = useState<{
//     name: string | null;
//     email: string | null;
//     image: string | null;
//     role: string;
//     id?: string;
//   } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [articleLoading, setArticleLoading] = useState(true);
//   const [article, setArticle] = useState<SupportArticle | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [scopeSaving, setScopeSaving] = useState(false);

//   // Form state for editing
//   const [formData, setFormData] = useState({
//     title: "",
//     summary: "",
//     category: "",
//     tags: "",
//     featuredImage: "",
//     readTimeMinutes: 5,
//   });

//   const [showSource, setShowSource] = useState(false);
//   const [sourceHtml, setSourceHtml] = useState("");

//   const initialMode = searchParams.get("mode");
//   const [editMode, setEditMode] = useState(initialMode === "edit");

//   // Hidden input for Featured Image upload
//   const featuredInputRef = useRef<HTMLInputElement>(null);

//   const editor = useEditor({
//     immediatelyRender: false,
//     extensions: [
//       StarterKit.configure({
//         heading: {
//           levels: [2, 3],
//         },
//         codeBlock: false,
//       }),
//       CodeBlock,
//       UnderlineExtension,
//       ImageExtension,
//       TextAlignExtension.configure({
//         types: ["heading", "paragraph"],
//       }),
//       LinkExtension.configure({
//         openOnClick: false,
//         autolink: true,
//       }),
//       Placeholder.configure({
//         placeholder: "Start writing your amazing article...",
//       }),
//     ],
//     editorProps: {
//       attributes: {
//         class:
//           "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
//       },
//     },
//     content: "",
//     onUpdate: ({ editor }) => {
//       setSourceHtml(editor.getHTML());
//     },
//   });

//   // Fetch user
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await fetch("/api/auth/me");
//         const data = await res.json();
//         if (!data?.authenticated || data?.user?.role === "GUEST") {
//           router.push("/login");
//           return;
//         }
//         setUser(data.user);
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         router.push("/login");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [router]);

//   // Fetch article by slug
//   useEffect(() => {
//     if (!slug) return;
//     const fetchArticle = async () => {
//       try {
//         const res = await fetch(
//           `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
//         );
//         const data = await res.json();
//         if (!res.ok) {
//           console.error("Failed to load article:", data);
//           return;
//         }
//         const a = data.article;
//         const mapped: SupportArticle = {
//           id: a.id,
//           title: a.title,
//           slug: a.slug,
//           summary: a.summary ?? null,
//           category: a.category ?? null,
//           tags: Array.isArray(a.tags) ? a.tags : [],
//           content: a.content,
//           featuredImage: a.featuredImage ?? null,
//           readTimeMinutes: a.readTimeMinutes ?? 5,
//           authorId: a.authorId,
//           authorName: a.author?.name || a.author?.email || "Author",
//           companyId: a.companyId ?? null,
//           isGlobal: !!a.isGlobal,
//           canEdit: !!a.canEdit,
//           canDelete: !!a.canDelete,
//           updatedAt: a.updatedAt,
//         };
//         setArticle(mapped);

//         // Populate form data
//         setFormData({
//           title: mapped.title,
//           summary: mapped.summary || "",
//           category: mapped.category || "",
//           tags: mapped.tags.join(", "),
//           featuredImage: mapped.featuredImage || "",
//           readTimeMinutes: mapped.readTimeMinutes,
//         });

//         setSourceHtml(mapped.content || "");
//         if (editor) {
//           editor.commands.setContent(mapped.content || "");
//         }
//       } catch (error) {
//         console.error("Error fetching article:", error);
//       } finally {
//         setArticleLoading(false);
//       }
//     };

//     fetchArticle();
//   }, [slug, editor]);

//   // Ensure edit mode only if allowed
//   useEffect(() => {
//     if (!article || !editMode) return;
//     if (!article.canEdit) {
//       setEditMode(false);
//     }
//   }, [article, editMode]);

//   const handleSourceToggle = (show: boolean) => {
//     if (!editor) return;
//     if (show) {
//       setSourceHtml(editor.getHTML());
//     } else {
//       editor.commands.setContent(sourceHtml);
//     }
//     setShowSource(show);
//   };

//   // --- Featured Image Handlers ---
//   const handleFeaturedUpload = async (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       try {
//         const base64 = await fileToBase64(file);
//         setFormData((prev) => ({ ...prev, featuredImage: base64 }));
//       } catch (error) {
//         console.error("Error converting featured image:", error);
//         toast.error("Failed to upload featured image");
//       }
//     }
//     if (featuredInputRef.current) featuredInputRef.current.value = "";
//   };

//   const handleRemoveFeatured = () => {
//     setFormData((prev) => ({ ...prev, featuredImage: "" }));
//   };

//   if (loading || articleLoading) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!article) {
//     return (
//       <DashboardLayout user={user || undefined}>
//         <div className="flex items-center justify-center h-96">
//           <p className="text-muted-foreground">Article not found.</p>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const handleSave = async () => {
//     if (!editor) return;
//     setSaving(true);
//     try {
//       const finalContent = showSource ? sourceHtml : editor.getHTML();

//       const tagsArray = formData.tags
//         .split(",")
//         .map((t) => t.trim())
//         .filter((t) => t.length > 0);

//       const res = await fetch(`/api/support/articles/${article.id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           content: finalContent,
//           title: formData.title,
//           summary: formData.summary,
//           category: formData.category,
//           tags: tagsArray,
//           featuredImage: formData.featuredImage || null,
//           readTimeMinutes: formData.readTimeMinutes,
//         }),
//       });
//       const data = await res.json().catch(() => null);
//       if (!res.ok) {
//         console.error("Failed to save article:", data);
//         toast.error("Failed to save article. Payload might be too large.");
//         return;
//       }

//       setArticle((prev) =>
//         prev
//           ? {
//               ...prev,
//               content: finalContent,
//               title: formData.title,
//               summary: formData.summary,
//               category: formData.category,
//               tags: tagsArray,
//               featuredImage: formData.featuredImage || null,
//               readTimeMinutes: formData.readTimeMinutes,
//             }
//           : prev
//       );
//       setEditMode(false);
//       setShowSource(false);
//       toast.success("Article saved successfully");
//     } catch (error) {
//       console.error("Save failed:", error);
//       toast.error("An error occurred while saving");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <StaffAndAbove>
//       <DashboardLayout user={user || undefined}>
//         <div className="flex justify-end mb-4 max-w-4xl mx-auto">
//           <div className="flex gap-2">
//             {article.canEdit && !editMode && (
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="gap-2"
//                 onClick={() => setEditMode(true)}
//               >
//                 <Pencil className="h-4 w-4" />
//                 Edit Article
//               </Button>
//             )}
//             {article.canEdit && editMode && (
//               <>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="gap-2"
//                   onClick={() => {
//                     if (editor) {
//                       editor.commands.setContent(article.content || "");
//                     }
//                     setFormData({
//                       title: article.title,
//                       summary: article.summary || "",
//                       category: article.category || "",
//                       tags: article.tags.join(", "),
//                       featuredImage: article.featuredImage || "",
//                       readTimeMinutes: article.readTimeMinutes,
//                     });
//                     setEditMode(false);
//                     setShowSource(false);
//                   }}
//                   disabled={saving}
//                 >
//                   <X className="h-4 w-4" />
//                   Cancel
//                 </Button>
//                 <Button
//                   size="sm"
//                   className="gap-2"
//                   onClick={handleSave}
//                   disabled={saving}
//                 >
//                   {saving ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Save className="h-4 w-4" />
//                   )}
//                   Save
//                 </Button>
//               </>
//             )}
//             {user?.role === "SUPER_ADMIN" && (
//               <Button
//                 size="sm"
//                 variant={article.isGlobal ? "default" : "outline"}
//                 className="gap-2"
//                 disabled={scopeSaving}
//                 onClick={async () => {
//                   setScopeSaving(true);
//                   try {
//                     const res = await fetch(
//                       `/api/support/articles/${article.id}`,
//                       {
//                         method: "PATCH",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({
//                           isGlobal: !article.isGlobal,
//                         }),
//                       }
//                     );
//                     const data = await res.json().catch(() => null);
//                     if (!res.ok) {
//                       console.error("Failed to change scope:", data);
//                       return;
//                     }
//                     setArticle((prev) =>
//                       prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
//                     );
//                   } catch (error) {
//                     console.error("Scope toggle failed:", error);
//                   } finally {
//                     setScopeSaving(false);
//                   }
//                 }}
//               >
//                 {scopeSaving ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Globe className="h-4 w-4" />
//                 )}
//                 {article.isGlobal ? "Global" : "Make Global"}
//               </Button>
//             )}
//           </div>
//         </div>

//         <KBArticle
//           title={article.title}
//           description={article.summary || ""}
//           category={article.category || "Uncategorized"}
//           tags={article.tags}
//           readTime={`${article.readTimeMinutes} min`}
//           lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
//           scopeLabel={
//             article.isGlobal ? "Global article" : "Company-scoped article"
//           }
//         >
//           {editMode && editor ? (
//             <div className="space-y-6">
//               {/* Metadata Form Fields */}
//               <div className="grid gap-4 p-4 border rounded-lg bg-card">
//                 <div className="grid gap-2">
//                   <Label htmlFor="title">Article Title</Label>
//                   <Input
//                     id="title"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData({ ...formData, title: e.target.value })
//                     }
//                   />
//                 </div>

//                 {/* FEATURED IMAGE UPLOAD */}
//                 <div className="grid gap-2">
//                   <Label>Featured Image</Label>
//                   <input
//                     type="file"
//                     ref={featuredInputRef}
//                     className="hidden"
//                     accept="image/*"
//                     onChange={handleFeaturedUpload}
//                   />
//                   <div className="flex items-start gap-4">
//                     {formData.featuredImage ? (
//                       <div className="relative group">
//                         <div className="h-32 w-48 rounded-md border overflow-hidden bg-muted">
//                           {/* eslint-disable-next-line @next/next/no-img-element */}
//                           <img
//                             src={formData.featuredImage}
//                             alt="Preview"
//                             className="h-full w-full object-cover"
//                           />
//                         </div>
//                         <Button
//                           type="button"
//                           variant="destructive"
//                           size="icon"
//                           className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
//                           onClick={handleRemoveFeatured}
//                         >
//                           <X className="h-3 w-3" />
//                         </Button>
//                       </div>
//                     ) : (
//                       <div
//                         onClick={() => featuredInputRef.current?.click()}
//                         className="h-32 w-48 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
//                       >
//                         <Upload className="h-6 w-6 text-muted-foreground" />
//                         <span className="text-xs text-muted-foreground">
//                           Upload Image
//                         </span>
//                       </div>
//                     )}
//                     <div className="flex-1 text-sm text-muted-foreground">
//                       <p>
//                         This image will be used as the thumbnail and header for
//                         the article.
//                       </p>
//                       {formData.featuredImage && (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           className="mt-2"
//                           onClick={() => featuredInputRef.current?.click()}
//                         >
//                           Change Image
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="category">Category</Label>
//                     <Input
//                       id="category"
//                       placeholder="e.g. Getting Started"
//                       value={formData.category}
//                       onChange={(e) =>
//                         setFormData({ ...formData, category: e.target.value })
//                       }
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="readTime">Read Time (min)</Label>
//                     <Input
//                       id="readTime"
//                       type="number"
//                       min={1}
//                       value={formData.readTimeMinutes}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           readTimeMinutes: parseInt(e.target.value) || 0,
//                         })
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="tags">Tags (comma separated)</Label>
//                   <Input
//                     id="tags"
//                     placeholder="email, setup, guide"
//                     value={formData.tags}
//                     onChange={(e) =>
//                       setFormData({ ...formData, tags: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div className="grid gap-2">
//                   <Label htmlFor="summary">Summary</Label>
//                   <Textarea
//                     id="summary"
//                     placeholder="Brief description of the article..."
//                     value={formData.summary}
//                     onChange={(e) =>
//                       setFormData({ ...formData, summary: e.target.value })
//                     }
//                   />
//                 </div>
//               </div>

//               {/* The Editor with Toolbar */}
//               <div className="grid gap-2">
//                 <Label>Content</Label>
//                 <div className="border rounded-md overflow-hidden bg-background">
//                   <EditorToolbar
//                     editor={editor}
//                     showSource={showSource}
//                     setShowSource={handleSourceToggle}
//                   />
//                   {showSource ? (
//                     <Textarea
//                       value={sourceHtml}
//                       onChange={(e) => setSourceHtml(e.target.value)}
//                       className="min-h-[400px] font-mono text-sm border-0 focus-visible:ring-0 rounded-none resize-y p-4"
//                       placeholder="Enter raw HTML here..."
//                     />
//                   ) : (
//                     <EditorContent editor={editor} />
//                   )}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {/* Display Featured Image if exists */}
//               {article.featuredImage && (
//                 <div className="rounded-lg overflow-hidden border bg-muted/20">
//                   {/* eslint-disable-next-line @next/next/no-img-element */}
//                   <img
//                     src={article.featuredImage}
//                     alt={article.title}
//                     className="w-full h-64 object-cover"
//                   />
//                 </div>
//               )}
//               <div
//                 className="prose prose-slate dark:prose-invert max-w-none"
//                 dangerouslySetInnerHTML={{ __html: article.content }}
//               />
//             </div>
//           )}
//         </KBArticle>
//       </DashboardLayout>
//     </StaffAndAbove>
//   );
// }

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KBArticle } from "@/components/kb-article";
import { StaffAndAbove } from "@/components/role-guard";
import {
  Loader2,
  Pencil,
  Save,
  X,
  Globe,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
  FileCode,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Printer,
  Copy,
  Minus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlignExtension from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlock from "@tiptap/extension-code-block";
import { toast } from "sonner";

// --- Helper: Upload File to your Cold Storage API ---
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  // CHANGE THIS URL to match your existing cold storage upload route
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  // CHANGE THIS if your API returns the url in a different property (e.g. data.secure_url)
  return data.url;
};

// --- Types ---
interface SupportArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  content: string;
  featuredImage: string | null;
  readTimeMinutes: number;
  authorId: string;
  authorName: string;
  companyId: string | null;
  isGlobal: boolean;
  canEdit: boolean;
  canDelete: boolean;
  updatedAt: string;
}

// --- Editor Toolbar Component ---
const EditorToolbar = ({
  editor,
  showSource,
  setShowSource,
}: {
  editor: Editor | null;
  showSource: boolean;
  setShowSource: (v: boolean) => void;
}) => {
  // Hidden input ref for editor images
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State for Links
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  if (!editor) return null;

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkValue(previousUrl || "");
    setLinkModalOpen(true);
  };

  const handleLinkSubmit = () => {
    if (linkValue === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkValue })
        .run();
    }
    setLinkModalOpen(false);
  };

  // Trigger the hidden file input
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection for Editor Content
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const toastId = toast.loading("Uploading image...");

      try {
        // Upload to server instead of Base64
        const imageUrl = await uploadFile(file);

        editor.chain().focus().setImage({ src: imageUrl }).run();
        toast.success("Image uploaded", { id: toastId });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image", { id: toastId });
      }
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = () => {
    const content = editor.getText();
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Hidden File Input for Editor Images */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={onFileChange}
      />

      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        {/* History & Utils */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || showSource}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || showSource}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handlePrint}
          title="Print"
        >
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleCopy}
          title="Copy Text"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={showSource}
          title="Heading 2"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={showSource}
          title="Heading 3"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Formatting */}
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={showSource}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={showSource}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={showSource}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          disabled={showSource}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          disabled={showSource}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          disabled={showSource}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          disabled={showSource}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists & Quotes */}
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={showSource}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={showSource}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={showSource}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Inserts */}
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={openLinkModal}
          disabled={showSource}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleImageClick}
          disabled={showSource}
          title="Upload Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={showSource}
          title="Horizontal Line"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={showSource}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Source Toggle */}
        <Button
          type="button"
          variant={showSource ? "default" : "outline"}
          size="sm"
          className="h-8 px-2 gap-2 text-xs"
          onClick={() => setShowSource(!showSource)}
          title="View Source HTML"
        >
          <FileCode className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:inline-block">Source</span>
        </Button>
      </div>

      {/* LINK MODAL */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-background border rounded-lg shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setLinkModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url-input">URL</Label>
              <Input
                id="url-input"
                placeholder="https://example.com"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLinkSubmit();
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLinkSubmit}>Save Link</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Main Page Component ---
export default function SupportArticlePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    id?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(true);
  const [article, setArticle] = useState<SupportArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [scopeSaving, setScopeSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    category: "",
    tags: "",
    featuredImage: "",
    readTimeMinutes: 5,
  });

  const [showSource, setShowSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState("");

  const initialMode = searchParams.get("mode");
  const [editMode, setEditMode] = useState(initialMode === "edit");

  // Hidden input for Featured Image upload
  const featuredInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        codeBlock: false,
      }),
      CodeBlock,
      UnderlineExtension,
      ImageExtension,
      TextAlignExtension.configure({
        types: ["heading", "paragraph"],
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing your amazing article...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
    content: "",
    onUpdate: ({ editor }) => {
      setSourceHtml(editor.getHTML());
    },
  });

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data?.authenticated || data?.user?.role === "GUEST") {
          router.push("/login");
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Fetch article by slug
  useEffect(() => {
    if (!slug) return;
    const fetchArticle = async () => {
      try {
        const res = await fetch(
          `/api/support/articles/by-slug?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json();
        if (!res.ok) {
          console.error("Failed to load article:", data);
          return;
        }
        const a = data.article;
        const mapped: SupportArticle = {
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: a.summary ?? null,
          category: a.category ?? null,
          tags: Array.isArray(a.tags) ? a.tags : [],
          content: a.content,
          featuredImage: a.featuredImage ?? null,
          readTimeMinutes: a.readTimeMinutes ?? 5,
          authorId: a.authorId,
          authorName: a.author?.name || a.author?.email || "Author",
          companyId: a.companyId ?? null,
          isGlobal: !!a.isGlobal,
          canEdit: !!a.canEdit,
          canDelete: !!a.canDelete,
          updatedAt: a.updatedAt,
        };
        setArticle(mapped);

        // Populate form data
        setFormData({
          title: mapped.title,
          summary: mapped.summary || "",
          category: mapped.category || "",
          tags: mapped.tags.join(", "),
          featuredImage: mapped.featuredImage || "",
          readTimeMinutes: mapped.readTimeMinutes,
        });

        setSourceHtml(mapped.content || "");
        if (editor) {
          editor.commands.setContent(mapped.content || "");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setArticleLoading(false);
      }
    };

    fetchArticle();
  }, [slug, editor]);

  // Ensure edit mode only if allowed
  useEffect(() => {
    if (!article || !editMode) return;
    if (!article.canEdit) {
      setEditMode(false);
    }
  }, [article, editMode]);

  const handleSourceToggle = (show: boolean) => {
    if (!editor) return;
    if (show) {
      setSourceHtml(editor.getHTML());
    } else {
      editor.commands.setContent(sourceHtml);
    }
    setShowSource(show);
  };

  // --- Featured Image Handlers ---
  const handleFeaturedUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const toastId = toast.loading("Uploading featured image...");
      try {
        // Upload to server instead of Base64
        const imageUrl = await uploadFile(file);
        setFormData((prev) => ({ ...prev, featuredImage: imageUrl }));
        toast.success("Featured image uploaded", { id: toastId });
      } catch (error) {
        console.error("Error uploading featured image:", error);
        toast.error("Failed to upload featured image", { id: toastId });
      }
    }
    if (featuredInputRef.current) featuredInputRef.current.value = "";
  };

  const handleRemoveFeatured = () => {
    setFormData((prev) => ({ ...prev, featuredImage: "" }));
  };

  if (loading || articleLoading) {
    return (
      <DashboardLayout user={user || undefined}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <DashboardLayout user={user || undefined}>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            We couldn&apos;t find any articles.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const finalContent = showSource ? sourceHtml : editor.getHTML();

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch(`/api/support/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalContent,
          title: formData.title,
          summary: formData.summary,
          category: formData.category,
          tags: tagsArray,
          featuredImage: formData.featuredImage || null,
          readTimeMinutes: formData.readTimeMinutes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Failed to save article:", data);
        toast.error("Failed to save article.");
        return;
      }

      setArticle((prev) =>
        prev
          ? {
              ...prev,
              content: finalContent,
              title: formData.title,
              summary: formData.summary,
              category: formData.category,
              tags: tagsArray,
              featuredImage: formData.featuredImage || null,
              readTimeMinutes: formData.readTimeMinutes,
            }
          : prev
      );
      setEditMode(false);
      setShowSource(false);
      toast.success("Article saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffAndAbove>
      <DashboardLayout user={user || undefined}>
        <div className="flex justify-end mb-4 max-w-4xl mx-auto">
          <div className="flex gap-2">
            {article.canEdit && !editMode && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setEditMode(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            {article.canEdit && editMode && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (editor) {
                      editor.commands.setContent(article.content || "");
                    }
                    setFormData({
                      title: article.title,
                      summary: article.summary || "",
                      category: article.category || "",
                      tags: article.tags.join(", "),
                      featuredImage: article.featuredImage || "",
                      readTimeMinutes: article.readTimeMinutes,
                    });
                    setEditMode(false);
                    setShowSource(false);
                  }}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            )}
            {user?.role === "SUPER_ADMIN" && (
              <Button
                size="sm"
                variant={article.isGlobal ? "default" : "outline"}
                className="gap-2"
                disabled={scopeSaving}
                onClick={async () => {
                  setScopeSaving(true);
                  try {
                    const res = await fetch(
                      `/api/support/articles/${article.id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          isGlobal: !article.isGlobal,
                        }),
                      }
                    );
                    const data = await res.json().catch(() => null);
                    if (!res.ok) {
                      console.error("Failed to change scope:", data);
                      return;
                    }
                    setArticle((prev) =>
                      prev ? { ...prev, isGlobal: !prev.isGlobal } : prev
                    );
                  } catch (error) {
                    console.error("Scope toggle failed:", error);
                  } finally {
                    setScopeSaving(false);
                  }
                }}
              >
                {scopeSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {article.isGlobal ? "Global" : "Make Global"}
              </Button>
            )}
          </div>
        </div>

        <KBArticle
          title={article.title}
          description={article.summary || ""}
          category={article.category || "Uncategorized"}
          tags={article.tags}
          readTime={`${article.readTimeMinutes} min`}
          lastUpdated={new Date(article.updatedAt).toLocaleDateString()}
          scopeLabel={
            article.isGlobal ? "Global article" : "Company-scoped article"
          }
        >
          {editMode && editor ? (
            <div className="space-y-6">
              {/* Metadata Form Fields */}
              <div className="grid gap-4 p-4 border rounded-lg bg-card">
                <div className="grid gap-2">
                  <Label htmlFor="title">Article Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                {/* FEATURED IMAGE UPLOAD */}
                <div className="grid gap-2">
                  <Label>Featured Image</Label>
                  <input
                    type="file"
                    ref={featuredInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFeaturedUpload}
                  />
                  <div className="flex items-start gap-4">
                    {formData.featuredImage ? (
                      <div className="relative group">
                        <div className="h-32 w-48 rounded-md border overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.featuredImage}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={handleRemoveFeatured}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => featuredInputRef.current?.click()}
                        className="h-32 w-48 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Upload Image
                        </span>
                      </div>
                    )}
                    <div className="flex-1 text-sm text-muted-foreground">
                      <p>
                        This image will be used as the thumbnail and header for
                        the article.
                      </p>
                      {formData.featuredImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => featuredInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g. Getting Started"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="readTime">Read Time (min)</Label>
                    <Input
                      id="readTime"
                      type="number"
                      min={1}
                      value={formData.readTimeMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          readTimeMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    placeholder="email, setup, guide"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    placeholder="Brief description of the article..."
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* The Editor with Toolbar */}
              <div className="grid gap-2">
                <Label>Content</Label>
                <div className="border rounded-md overflow-hidden bg-background">
                  <EditorToolbar
                    editor={editor}
                    showSource={showSource}
                    setShowSource={handleSourceToggle}
                  />
                  {showSource ? (
                    <Textarea
                      value={sourceHtml}
                      onChange={(e) => setSourceHtml(e.target.value)}
                      className="min-h-[400px] font-mono text-sm border-0 focus-visible:ring-0 rounded-none resize-y p-4"
                      placeholder="Enter raw HTML here..."
                    />
                  ) : (
                    <EditorContent editor={editor} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Display Featured Image if exists */}
              {article.featuredImage && (
                <div className="rounded-lg overflow-hidden border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              <div
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          )}
        </KBArticle>
      </DashboardLayout>
    </StaffAndAbove>
  );
}
