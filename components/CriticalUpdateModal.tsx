import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Alert } from 'react-native';
import * as Updates from 'expo-updates';

interface CriticalUpdateModalProps {
  visible: boolean;
  onRestart: () => void;
}

export const CriticalUpdateModal: React.FC<CriticalUpdateModalProps> = ({
  visible,
  onRestart,
}) => {
  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to restart the app. Please restart manually.');
      onRestart();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {}} // Prevent dismissing
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Critical Update Required</Text>
          <Text style={styles.message}>
            A critical update is available. The app needs to restart to apply the changes.
          </Text>
          <Pressable style={styles.button} onPress={handleRestart}>
            <Text style={styles.buttonText}>Restart App</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});