export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const fetchWithRetry = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const {
    timeout = 8000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let attempt = 0;

  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal as any,
      });

      clearTimeout(id);

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`, response.status);
      }

      return response;
    } catch (error: any) {
      attempt++;
      
      // If it's an AbortError (timeout) or network error, and we have retries left
      if (attempt < retries && (error.name === 'AbortError' || !navigator.onLine || error instanceof NetworkError)) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
      
      throw error;
    }
  }

  throw new Error('Maximum retries reached');
};

export const useNetworkStatus = () => {
  // Can be implemented as a hook if needed
};
