'use client';

import { useEffect, useRef, useState } from 'react';
import { api, formatApiError } from '../../lib/api';

export function useBookDiscussion(bookId, signedIn) {
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [eligible, setEligible] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.reviews(bookId), api.questions(bookId)])
      .then(([reviewData, questionData]) => {
        if (!active) return;
        setReviews(
          Array.isArray(reviewData) ? reviewData : reviewData.reviews || []
        );
        setQuestions(questionData);
      })
      .catch((error) => {
        if (active) setLoadError(formatApiError(error));
      });
    if (signedIn) {
      api
        .reviewEligibility(bookId)
        .then((data) => {
          if (active) setEligible(data.canReview);
        })
        .catch((error) => {
          if (active) setLoadError(formatApiError(error));
        });
    }
    return () => {
      active = false;
    };
  }, [bookId, signedIn]);

  async function submit(save) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await save();
      return true;
    } catch (error) {
      setMessage(formatApiError(error));
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function saveReview(review) {
    return submit(async () => {
      const saved = await api.saveReview(bookId, review);
      setReviews((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      setMessage('Đã lưu đánh giá của bạn.');
    });
  }

  function askQuestion(question) {
    return submit(async () => {
      const saved = await api.askQuestion(bookId, question);
      setQuestions((current) => [saved, ...current]);
      setMessage('Đã gửi câu hỏi. Thư viện sẽ trả lời tại đây.');
    });
  }

  return {
    reviews,
    questions,
    eligible,
    busy,
    message,
    loadError,
    saveReview,
    askQuestion,
  };
}
