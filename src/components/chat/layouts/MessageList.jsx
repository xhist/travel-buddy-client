import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';

export const MessageList = ({ messages, currentUser, onReact, loadMore, hasMore }) => {
  const observerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          await loadMore();
          setLoading(false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
      {hasMore && <div ref={observerRef} className="h-4" />}
      <div className="flex flex-col-reverse">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            currentUser={currentUser}
            onReact={onReact}
          />
        ))}
      </div>
    </div>
  );
};