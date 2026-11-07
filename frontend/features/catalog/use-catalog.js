'use client';

import { useEffect, useState } from 'react';
import { api, formatApiError } from '../../lib/api';

export const CATALOG_PAGE_SIZE = 12;

export function useCatalog(initialQuery) {
  const [books, setBooks] = useState([]),
    [ratings, setRatings] = useState({}),
    [categories, setCategories] = useState(['Tất cả']),
    [category, setCategory] = useState('Tất cả');
  const [query, setQuery] = useState(initialQuery),
    [author, setAuthor] = useState(''),
    [min, setMin] = useState(''),
    [max, setMax] = useState(''),
    [availability, setAvailability] = useState(''),
    [sort, setSort] = useState('title'),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [total, setTotal] = useState(0),
    [totalPages, setTotalPages] = useState(1),
    [retry, setRetry] = useState(0);
  const refresh = () => setRetry((n) => n + 1);
  useEffect(() => {
    let active = true;
    api
      .categories()
      .then((list) => {
        if (active) setCategories(['Tất cả', ...list.map((c) => c.name)]);
      })
      .catch(() => {});
    api
      .bookRatings()
      .then((data) => {
        if (active) setRatings(data || {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = {
        q: query,
        author,
        category: category === 'Tất cả' ? '' : category,
        status: availability,
        sort: sort === 'rental' ? 'price_asc' : sort,
        page: String(page - 1),
      };
      if (min !== '') params.min = min;
      if (max !== '') params.max = max;
      api
        .catalog(params)
        .then((result) => {
          if (!active) return;
          setBooks(result.content || []);
          setTotal(result.totalElements || 0);
          setTotalPages(Math.max(1, result.totalPages || 1));
          setError('');
        })
        .catch((e) => {
          if (active) {
            setError(formatApiError(e));
            setBooks([]);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, author, min, max, availability, category, sort, page, retry]);
  const currentPage = Math.min(page, totalPages);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
  );

  const filters = { query, author, min, max, availability, sort, category };
  const setters = {
    query: setQuery,
    author: setAuthor,
    min: setMin,
    max: setMax,
    availability: setAvailability,
    sort: setSort,
    category: setCategory,
  };
  function changeFilter(name, value) {
    setters[name](value);
    setPage(1);
  }

  function resetFilters() {
    setQuery('');
    setAuthor('');
    setMin('');
    setMax('');
    setAvailability('');
    setCategory('Tất cả');
    setSort('title');
    setPage(1);
  }

  function resetSearch() {
    setCategory('Tất cả');
    setQuery('');
  }

  return {
    books,
    ratings,
    categories,
    filters,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    pageNumbers,
    setPage,
    refresh,
    changeFilter,
    resetFilters,
    resetSearch,
  };
}
