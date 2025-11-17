import React, { Suspense, ComponentType } from 'react';
import { PurpleGlassSpinner } from '@/components/ui';

/**
 * Lazy load a component with a loading fallback
 * Provides better UX than default React.lazy
 */
export function lazyWithFallback<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense
      fallback={
        fallback || (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              width: '100%'
            }}
          >
            <PurpleGlassSpinner size="large" />
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component
 * Useful for prefetching routes or components before they're needed
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return importFunc();
}

/**
 * Lazy load with retry logic
 * Handles chunk loading failures gracefully
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  retryDelay = 1000
) {
  return React.lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptsLeft: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 0) {
              reject(error);
              return;
            }

            console.warn(
              `Failed to load component, ${attemptsLeft} ${
                attemptsLeft === 1 ? 'retry' : 'retries'
              } remaining...`
            );

            setTimeout(() => {
              attemptLoad(attemptsLeft - 1);
            }, retryDelay);
          });
      };

      attemptLoad(retries);
    })
  );
}

export default lazyWithFallback;
