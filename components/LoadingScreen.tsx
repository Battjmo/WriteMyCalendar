import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

export default function LoadingScreen() {
  return (
    <ThemedView style={styles.container} fullScreen>
      <ActivityIndicator size="large" color="#0a7ea4" />
      <ThemedText style={styles.text}>Processing photo...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
});
