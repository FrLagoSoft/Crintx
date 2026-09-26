import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, className = '' }: Props) {
  const off = disabled || loading;
  const primary = variant === 'primary';
  const fg = off ? colors.dim : primary ? colors.void : colors.text;
  const shell = primary ? (off ? 'bg-edge' : 'bg-signal active:opacity-80') : 'border border-edge active:bg-edge';

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      className={`flex-row items-center justify-center gap-sm rounded-pill px-md py-sm ${shell} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        icon && <Ionicons name={icon} size={18} color={fg} />
      )}
      <Text className="font-semibold" style={{ color: fg }}>{label}</Text>
    </Pressable>
  );
}
