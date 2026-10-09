import { StyleSheet, Text, View } from 'react-native';

export default function ItemDetailScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Item detail</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
