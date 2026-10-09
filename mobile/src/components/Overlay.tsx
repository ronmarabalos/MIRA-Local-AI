/**
 * The boards' bottom sheet (mira-up) and centred alert dialog (mira-in), over
 * the ink scrim. Both close with the system Back button.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fx } from '../theme/effects';
import { FadeIn, SlideUp } from './motion';

type Props = {
  visible: boolean;
  onClose(): void;
  label: string;
  children: ReactNode;
};

export function Sheet({ visible, onClose, label, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-ink/42">
        <Pressable accessibilityLabel="Close" className="absolute inset-0" onPress={onClose} />
        <SlideUp>
          <View
            accessibilityViewIsModal
            accessibilityLabel={label}
            className="gap-16 rounded-t-32 border border-white/90 px-20 pt-12"
            style={{ backgroundColor: 'rgba(238,241,249,0.86)', paddingBottom: 36 + insets.bottom }}
          >
            <View className="h-5 w-40 self-center rounded-full bg-peri-track" />
            {children}
          </View>
        </SlideUp>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Dialog({ visible, onClose, label, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-ink/42 px-24">
        <Pressable accessibilityLabel="Close" className="absolute inset-0" onPress={onClose} />
        <FadeIn from="scale">
          <View
            accessibilityViewIsModal
            accessibilityRole="alert"
            accessibilityLabel={label}
            className="gap-14 rounded-28 border border-white/90 p-22"
            style={[fx.dialog, { backgroundColor: 'rgba(242,244,250,0.9)' }]}
          >
            {children}
          </View>
        </FadeIn>
      </View>
    </Modal>
  );
}
