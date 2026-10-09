import { StyleSheet, Text, View } from 'react-native';

export default function AskScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Ask</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
