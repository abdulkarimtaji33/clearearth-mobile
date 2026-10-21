/** One place that turns any thrown value into a message that is safe to show a user. */
export function toUserMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as {
    response?: { data?: { message?: string; errors?: { msg?: string }[] }; status?: number };
    message?: string;
    code?: string;
  };
  const apiMessage = e?.response?.data?.message;
  const firstFieldError = e?.response?.data?.errors?.[0]?.msg;
  if (firstFieldError) return firstFieldError;
  if (apiMessage) return apiMessage;
  if (e?.message === 'Network Error' || e?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  if (e?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (e?.response?.status === 403) return "You don't have permission to do that.";
  return fallback;
}
