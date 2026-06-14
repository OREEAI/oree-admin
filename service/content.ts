import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

// Backed by marketing.BlogPostAdminViewSet / BlogAuthorAdminViewSet (#41):
//   GET    /api/marketing/admin/posts            (?status=&paginate=false)
//   POST   /api/marketing/admin/posts
//   GET    /api/marketing/admin/posts/<slug>
//   PATCH  /api/marketing/admin/posts/<slug>
//   DELETE /api/marketing/admin/posts/<slug>
//   POST   /api/marketing/admin/posts/<slug>/publish | /unpublish
//   GET    /api/marketing/admin/authors

export const POST_STATUSES = ["draft", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

// Values mirror marketing.BlogPostCategoryChoices (display labels are the
// stored values — see the backend enum).
export const POST_CATEGORIES = [
  "Outbound",
  "Deliverability",
  "AI & Automation",
  "Sales Strategy",
  "Inside OREE",
] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export type BlogAuthor = {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  linkedin_url?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  body_mdx: string;
  author_fk: string | null;
  author_name?: string | null;
  status: PostStatus;
  cover_image_url: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  seo_title: string;
  seo_description: string;
  reading_time_min: number | null;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

// Fields the editor sends. slug is set on create and immutable thereafter.
export type BlogPostInput = {
  title: string;
  slug?: string;
  body_mdx: string;
  author_fk: string | null;
  status?: PostStatus;
  cover_image_url: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  seo_title: string;
  seo_description: string;
};

const POSTS = "/api/marketing/admin/posts";
const AUTHORS = "/api/marketing/admin/authors";

export async function ListPostsApi(status?: PostStatus): Promise<BlogPost[]> {
  const { data } = await apiClient.get<BlogPost[] | ApiEnvelope<BlogPost[]>>(POSTS, {
    params: { paginate: "false", ...(status ? { status } : {}) },
  });
  // handle_response OMITS the `data` key when the list is empty (`if data:`),
  // so unwrapApiEnvelope can hand back a non-array — coerce so callers can
  // always .map() safely.
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export async function GetPostApi(slug: string): Promise<BlogPost> {
  const { data } = await apiClient.get<BlogPost | ApiEnvelope<BlogPost>>(
    `${POSTS}/${slug}`,
  );
  return unwrapApiEnvelope(data);
}

export async function CreatePostApi(payload: BlogPostInput): Promise<BlogPost> {
  const { data } = await apiClient.post<BlogPost | ApiEnvelope<BlogPost>>(POSTS, payload);
  return unwrapApiEnvelope(data);
}

export async function UpdatePostApi(
  slug: string,
  payload: Partial<BlogPostInput>,
): Promise<BlogPost> {
  const { data } = await apiClient.patch<BlogPost | ApiEnvelope<BlogPost>>(
    `${POSTS}/${slug}`,
    payload,
  );
  return unwrapApiEnvelope(data);
}

export async function DeletePostApi(slug: string): Promise<void> {
  await apiClient.delete(`${POSTS}/${slug}`);
}

export async function PublishPostApi(slug: string): Promise<BlogPost> {
  const { data } = await apiClient.post<BlogPost | ApiEnvelope<BlogPost>>(
    `${POSTS}/${slug}/publish`,
  );
  return unwrapApiEnvelope(data);
}

export async function UnpublishPostApi(slug: string): Promise<BlogPost> {
  const { data } = await apiClient.post<BlogPost | ApiEnvelope<BlogPost>>(
    `${POSTS}/${slug}/unpublish`,
  );
  return unwrapApiEnvelope(data);
}

export async function ListAuthorsApi(): Promise<BlogAuthor[]> {
  const { data } = await apiClient.get<BlogAuthor[] | ApiEnvelope<BlogAuthor[]>>(
    AUTHORS,
    { params: { paginate: "false" } },
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}
