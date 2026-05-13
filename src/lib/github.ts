type GithubRepo = { stargazersCount: number };

/**
 * Fetches the star count for a public GitHub repo.
 * Cached at the edge for 1 hour via Next.js fetch revalidation.
 * Returns null on network or API error — callers should fall back gracefully.
 */
export async function getRepoStars(owner: string, repo: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as GithubRepo;
    return typeof data.stargazersCount === 'number' ? data.stargazersCount : null;
  } catch {
    return null;
  }
}

/** 845 → "845", 1234 → "1.2k", 12345 → "12.3k", 1234567 → "1.2M". */
export function formatStars(count: number | null | undefined): string | null {
  if (count == null) {
    return null;
  }
  if (count < 1000) {
    return count.toString();
  }
  if (count < 1_000_000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}
