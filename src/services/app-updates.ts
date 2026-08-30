import * as Updates from 'expo-updates';

export async function checkAndInstallUpdate() {
  if (!Updates.isEnabled) return 'disabled' as const;
  const update = await Updates.checkForUpdateAsync();
  if (!update.isAvailable) return 'current' as const;
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
  return 'installed' as const;
}
