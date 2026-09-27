import { useRef, useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void; // while dragging
  onCommit: (value: number) => void; // on release
  disabled?: boolean;
  min?: number; // default 0
  max?: number; // default 100
  step?: number; // default 5
  /** Text on the right. Default: "Off" at the minimum, otherwise "N%". */
  format?: (value: number) => string;
};

const FILL_MIN = 104; // the navy part always fits its label, even at the minimum
const DRAG_THRESHOLD = 6; // px of sideways movement before it counts as a drag
const percent = (v: number) => (v === 0 ? 'Off' : `${v}%`);

/**
 * Pill slider: cream track, navy fill carrying the label, value on the right.
 * Plain React Native (no native module, so no new dev build needed).
 *
 * Only a deliberate sideways drag changes the value, and it moves *relative to
 * where it was*. It used to jump to the finger on touch-down, so a tap on the
 * "Volume" label or a page swipe that started on the slider silently set the
 * tags to 0 (and they saved it). Taps now do nothing.
 */
export function LevelSlider({
  label,
  value,
  onChange,
  onCommit,
  disabled,
  min = 0,
  max = 100,
  step = 5,
  format = percent,
}: Props) {
  const [width, setWidth] = useState(0);
  const drag = useRef({ startX: 0, startValue: value, moved: false, latest: value });
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  // pageX (screen position) stays stable while dragging, unlike locationX.
  const valueFor = (e: GestureResponderEvent) => {
    const track = Math.max(1, width - FILL_MIN);
    const dx = e.nativeEvent.pageX - drag.current.startX;
    const raw = drag.current.startValue + (dx / track) * (max - min);
    return clamp(min + Math.round((raw - min) / step) * step);
  };

  const nudge = (delta: number) => {
    const v = clamp(value + delta);
    onChange(v);
    onCommit(v);
  };

  const fill = FILL_MIN + (Math.max(0, width - FILL_MIN) * (value - min)) / (max - min);

  return (
    <View
      className={`h-12 justify-center rounded-pill bg-cream ${disabled ? 'opacity-50' : ''}`}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderTerminationRequest={() => false} // keep the drag from turning into a page swipe
      onResponderGrant={(e) => {
        // Remember where the finger landed; don't change anything yet.
        drag.current = { startX: e.nativeEvent.pageX, startValue: value, moved: false, latest: value };
        return true; // Android: stops the page pager from taking over the drag
      }}
      onResponderMove={(e) => {
        const d = drag.current;
        if (!d.moved && Math.abs(e.nativeEvent.pageX - d.startX) < DRAG_THRESHOLD) return;
        d.moved = true;
        const v = valueFor(e);
        if (v !== d.latest) {
          d.latest = v;
          onChange(v);
        }
      }}
      onResponderRelease={() => {
        const d = drag.current;
        if (d.moved && d.latest !== d.startValue) onCommit(d.latest); // taps and no-op drags send nothing
      }}
      onResponderTerminate={() => {
        const d = drag.current;
        if (d.moved && d.latest !== d.startValue) onChange(d.startValue); // gesture stolen: put it back
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? step * 2 : -step * 2)}
    >
      {/* pointerEvents none: touches must land on the track itself, or locationX is off */}
      <View pointerEvents="none" className="absolute inset-y-0 left-0 justify-center rounded-pill bg-ink px-md" style={{ width: fill }}>
        <Text className="font-mono text-sm text-cream">{label}</Text>
      </View>
      <Text pointerEvents="none" className="absolute right-md font-mono text-sm text-ink">
        {format(value)}
      </Text>
    </View>
  );
}
