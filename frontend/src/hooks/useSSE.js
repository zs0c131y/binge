import { useEffect, useRef } from 'react';

export function useSSE(onEvent) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    let es;
    let retryTimeout;

    function connect() {
      es = new EventSource('/api/events', { withCredentials: true });

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type !== 'connected') cbRef.current(event);
        } catch { /* ignore malformed */ }
      };

      es.onerror = () => {
        es.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => { clearTimeout(retryTimeout); es?.close(); };
  }, []); // only connect once per mount
}
