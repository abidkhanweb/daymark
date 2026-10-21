export const SETTINGS_EDGE_WIDTH = 32;

const tabs = ['/', '/tasks', '/notes', '/expenses'] as const;

export function swipeDestination(pathname: string, startX: number, distanceX: number) {
  if (Math.abs(distanceX) < 70) return null;
  if (startX <= SETTINGS_EDGE_WIDTH) return distanceX > 0 ? '/settings' : null;

  const index = Math.max(0, tabs.findIndex((route) => route === pathname));
  return tabs[distanceX < 0 ? index + 1 : index - 1] ?? null;
}
