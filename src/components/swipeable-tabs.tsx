import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { PropsWithChildren, useMemo } from 'react';
import { PanResponder, Platform, View } from 'react-native';

import { SETTINGS_EDGE_WIDTH, swipeDestination } from './swipe-navigation';

export function SwipeableTabs({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => Platform.OS !== 'web' && Math.abs(gesture.dx) > 28 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5 && (gesture.x0 > SETTINGS_EDGE_WIDTH || gesture.dx > 0),
    onPanResponderRelease: (_, gesture) => {
      const destination = swipeDestination(pathname, gesture.x0, gesture.dx);
      if (destination === '/settings') router.push(destination);
      else if (destination) router.navigate(destination as Href);
    },
  }), [pathname, router]);

  return <View style={{ flex: 1 }} {...responder.panHandlers}>{children}</View>;
}
