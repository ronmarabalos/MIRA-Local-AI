import { StyleSheet, Text, View } from 'react-native';

export default function PrivacyProofScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Privacy proof</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
