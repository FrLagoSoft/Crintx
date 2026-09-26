import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';
import { colors } from '../theme';

type Props = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  value: number; // 0-100
  onChange: (value: number) => void; // while dragging
  onCommit: (value: number) => void; // on release
  disabled?: boolean;
};

const STEP = 5;
const THUMB = 22;

/** 0-100 slider in plain React Native (no native module, so no new dev build needed). */
export function LevelSlider({ label, icon, value, onChange, onCommit, disabled }: Props) {
  const [width, setWidth] = useState(0);
  const latest = useRef(value);

  const valueAt = (e: GestureResponderEvent) => {
    const ratio = width > 0 ? e.nativeEvent.locationX / width : 0;
    const v = Math.round((Math.min(1, Math.max(0, ratio)) * 100) / STEP) * STEP;
    latest.current = v;
    return v;
  };

  const nudge = (delta: number) => {
    const v = Math.min(100, Math.max(0, value + delta));
    onChange(v);
    onCommit(v);
  };

  return (
    <View className={disabled ? 'opacity-50' : ''}>
      <View className="mb-xs flex-row items-center gap-sm">
        <Ionicons name={icon} size={16} color={colors.dim} />
        <Text className="flex-1 text-dim">{label}</Text>
        <Text className="font-semibold text-text">{value === 0 ? 'Off' : `${value}%`}</Text>
      </View>

      <View
        className="h-9 justify-center"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderTerminationRequest={() => false} // keep the drag from turning into a scroll
        onResponderGrant={(e) => onChange(valueAt(e))}
        onResponderMove={(e) => onChange(valueAt(e))}
        onResponderRelease={() => onCommit(latest.current)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 10 : -10)}
      >
        {/* pointerEvents none: touches must land on the track itself, or locationX is off */}
        <View pointerEvents="none">
          <View className="h-1.5 rounded-pill bg-edge">
            <View className="h-1.5 rounded-pill bg-signal" style={{ width: `${value}%` }} />
          </View>
          <View
            className="absolute rounded-pill border-2 border-void bg-signal"
            style={{
              width: THUMB,
              height: THUMB,
              top: -(THUMB - 6) / 2,
              left: Math.max(0, (width * value) / 100 - THUMB / 2),
            }}
          />
        </View>
      </View>
    </View>
  );
}
