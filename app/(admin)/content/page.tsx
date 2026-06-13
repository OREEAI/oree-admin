import { redirect } from "next/navigation";

// Content hub → default to the posts list. Resources/authors management
// can hang off /content later (C8 extends to those next).
export default function ContentIndexPage() {
  redirect("/content/posts");
}
