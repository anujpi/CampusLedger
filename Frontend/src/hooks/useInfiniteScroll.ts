import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface SpringPage<T> {
  content: T[];
  last: boolean;
  number: number;
}

export function useInfiniteScroll<T>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(0);

  const fetchPage = async (pageNum: number) => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await api<SpringPage<T>>(`${endpoint}?page=${pageNum}&size=10`);
      setItems(prev => pageNum === 0 ? data.content : [...prev, ...data.content]);
      hasMoreRef.current = !data.last;
      pageRef.current = pageNum;
      setHasMore(!data.last);
      setPage(pageNum);
    } catch {
      // silently fail
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
  }, [endpoint]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPage(pageRef.current + 1);
        }
      },
      { threshold: 1.0 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  return { items, loading, hasMore, loaderRef };
}