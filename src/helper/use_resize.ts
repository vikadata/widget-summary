import { useDebounceFn } from 'ahooks';
import { useEffect, useRef } from 'react';

export const useResize = (cb: ((rect: DOMRectReadOnly) => void), dep: any[] = []) => {
  const resizeObserverRef = useRef<HTMLElement>(null);

  const { run: resizeCallback } = useDebounceFn(cb, { wait: 300 });

  useEffect(() => {
    try {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        const rect = entry.contentRect;
        resizeCallback(rect);
      });

      observer.observe(resizeObserverRef.current!);
    } catch (error) {
      console.error('当前浏览器不支持 ResizeObserver');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeCallback, resizeObserverRef, ...dep]);

  return resizeObserverRef;
};
