export const formatDate = (value: Date | string, includeYear = false) => includeYear
  ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  : new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
export const formatTime = (value: Date | string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
