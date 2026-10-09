import { StyleSheet, Text, View } from 'react-native';

export default function RulesScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Rules</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
