import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { BLE } from '../config';
import { colors } from '../theme';
import { Button } from './Button';

type Props = {
  name: string | null; // tag being renamed; null = closed
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
};

/** Popup for renaming a tag (opened by long-pressing its tile). */
export function RenameSheet({ name, saving, onSave, onClose }: Props) {
  const [draft, setDraft] = useState('');
  useEffect(() => setDraft(name ?? ''), [name]);

  return (
    <Modal visible={name !== null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable onPress={onClose} className="flex-1 justify-center bg-black/40 px-lg">
          {/* Inner Pressable swallows taps so tapping the card doesn't close it */}
          <Pressable onPress={() => {}} className="rounded-tray bg-panel p-lg">
            <Text className="font-heading text-2xl text-ink">Rename tag</Text>
            <Text className="mt-xs font-mono text-xs text-dim">Saved on the tag. It restarts in a second.</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              maxLength={BLE.NAME_MAX_LEN}
              autoFocus
              autoCorrect={false}
              placeholder="New name"
              placeholderTextColor={colors.dim}
              onSubmitEditing={() => onSave(draft)}
              className="mt-md rounded-pill border-2 border-ink bg-cream px-md py-sm font-mono text-ink"
            />
            <View className="mt-md flex-row gap-sm">
              <Button label="Cancel" variant="outline" onPress={onClose} disabled={saving} className="flex-1" />
              <Button label="Save" onPress={() => onSave(draft)} loading={saving} className="flex-1" />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
