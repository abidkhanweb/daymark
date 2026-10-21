import AppTabs from '@/components/app-tabs';
import { SwipeableTabs } from '@/components/swipeable-tabs';
import { useDemoMode } from '@/features/demo/demo-mode';

export default function TabLayout() {
  const { isDemo, session } = useDemoMode();
  return <SwipeableTabs><AppTabs key={isDemo ? `demo-${session}` : 'personal'} /></SwipeableTabs>;
}
