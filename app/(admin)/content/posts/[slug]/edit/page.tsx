"use client";

import { useParams } from "next/navigation";

import { PostEditor } from "@/components/content/post-editor";

export default function EditPostPage() {
  const params = useParams<{ slug: string }>();
  return <PostEditor slug={params.slug} />;
}
