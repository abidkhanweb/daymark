import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleProp, TextStyle } from 'react-native';

export type AppIconName = keyof typeof MaterialIcons.glyphMap;

type Props = {
  name: AppIconName | { android?: AppIconName; web?: AppIconName; ios?: string };
  size?: number;
  tintColor?: string;
  style?: StyleProp<TextStyle>;
};

export function AppIcon({ name, size = 22, tintColor, style }: Props) {
  const icon = typeof name === 'string' ? name : name.web ?? name.android ?? 'help-outline';
  return <MaterialIcons name={icon} size={size} color={tintColor} style={style} />;
}
