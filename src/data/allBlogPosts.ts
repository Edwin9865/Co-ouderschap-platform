// src/data/allBlogPosts.ts
// Automatically imports every blogPosts*.ts file in this directory.
// To add more posts: create blogPosts3.ts, blogPosts4.ts, etc. and export a named array from each.
// No other changes needed — this file picks them up automatically via import.meta.glob.

import type { BlogPost } from './blogPosts';

const modules = import.meta.glob<Record<string, BlogPost[]>>('./blogPosts*.ts', { eager: true });

export const allPosts: BlogPost[] = Object.values(modules)
  .flatMap((mod) =>
    Object.values(mod).filter((v): v is BlogPost[] => Array.isArray(v))
  )
  .flat()
  .sort((a, b) => (a.date < b.date ? 1 : -1));
