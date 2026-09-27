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

/** Navy pill with a cream outline (primary), or a navy-outlined pill (outline). */
export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, className = '' }: Props) {
  const off = disabled || loading;
  const primary = variant === 'primary';
  const fg = primary ? colors.cream : colors.ink;
  const shell = primary ? 'bg-ink border-2 border-cream' : 'border-2 border-ink';

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      className={`flex-row items-center justify-center gap-sm rounded-pill px-md py-sm active:opacity-80 ${shell} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        icon && <Ionicons name={icon} size={18} color={fg} />
      )}
      <Text className="font-mono text-sm" style={{ color: fg }}>{label}</Text>
    </Pressable>
  );
}
