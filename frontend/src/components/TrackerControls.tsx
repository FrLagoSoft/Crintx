import { Pressable, Text, TextInput } from 'react-native';
import { colors } from '../theme';
export function Action({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={{ opacity: disabled ? 0.4 : 1, padding: 12, marginTop: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.signal }}>
    <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '600' }}>{title}</Text>
  </Pressable>;
}
export function Field({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder}
    placeholderTextColor={colors.dim} maxLength={80} style={{ color: colors.text, borderWidth: 1, borderColor: colors.edge, borderRadius: 12, padding: 12, marginTop: 10 }} />;
}
