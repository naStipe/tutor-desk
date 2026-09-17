import { unstable_cache } from "next/cache";

/**
 * Caches a per-tutor read query in Next.js's Data Cache, which — unlike a
 * plain in-memory Map — persists across serverless invocations on Vercel.
 * `fetcher` must not call cookies()/headers() (build its Supabase client
 * from a token via createTokenClient before calling in).
 */
export function cachedForTutor<T>(
  name: string,
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  return unstable_cache(fetcher, [name, ...keyParts], {
    revalidate: revalidateSeconds,
    tags,
  })();
}

export function tutorTag(
  resource: "students" | "lessons" | "homework" | "subjects" | "rates" | "profile",
  tutorId: string,
) {
  return `${resource}:${tutorId}`;
}
