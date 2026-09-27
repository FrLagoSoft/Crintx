import { useRef, useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';

type Props = {
  label: string;
  value: number; // 0-100
  onChange: (value: number) => void; // while dragging
  onCommit: (value: number) => void; // on release
  disabled?: boolean;
};

const STEP = 5;
const FILL_MIN = 104; // the navy part always fits its label, even at 0

/**
 * Pill slider: cream track, navy fill carrying the label, value on the right.
 * Plain React Native (no native module, so no new dev build needed).
 */
export function LevelSlider({ label, value, onChange, onCommit, disabled }: Props) {
  const [width, setWidth] = useState(0);
  const latest = useRef(value);

  const valueAt = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX - FILL_MIN;
    const ratio = width > FILL_MIN ? x / (width - FILL_MIN) : 0;
    const v = Math.round((Math.min(1, Math.max(0, ratio)) * 100) / STEP) * STEP;
    latest.current = v;
    return v;
  };

  const nudge = (delta: number) => {
    const v = Math.min(100, Math.max(0, value + delta));
    onChange(v);
    onCommit(v);
  };

  const fill = FILL_MIN + (Math.max(0, width - FILL_MIN) * value) / 100;

  return (
    <View
      className={`h-12 justify-center rounded-pill bg-cream ${disabled ? 'opacity-50' : ''}`}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderTerminationRequest={() => false} // keep the drag from turning into a page swipe
      onResponderGrant={(e) => {
        onChange(valueAt(e));
        return true; // Android: stops the page pager from taking over the drag
      }}
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
      <View pointerEvents="none" className="absolute inset-y-0 left-0 justify-center rounded-pill bg-ink px-md" style={{ width: fill }}>
        <Text className="font-mono text-sm text-cream">{label}</Text>
      </View>
      <Text pointerEvents="none" className="absolute right-md font-mono text-sm text-ink">
        {value === 0 ? 'Off' : `${value}%`}
      </Text>
    </View>
  );
}
