import { StyleSheet, Text, View } from 'react-native';

export default function ChannelsScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Channels</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
