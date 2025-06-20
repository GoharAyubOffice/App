import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../../store/hooks';
import { moodQueries } from '../../../db/queries/moodQueries';
import { MoodEntry, MoodLabel } from '../../../db/model/moodEntry';

const { width } = Dimensions.get('window');

export default function MoodLogScreen() {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [todaysMood, setTodaysMood] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Animation values
  const scaleAnim = useState(() => new Animated.Value(1))[0];
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  const moodOptions = MoodEntry.getMoodOptions();

  useEffect(() => {
    checkExistingMoodToday();
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkExistingMoodToday = async () => {
    if (!currentUser?.id) return;

    try {
      setCheckingExisting(true);
      const today = new Date();
      const result = await moodQueries.getMoodEntryForDate(currentUser.id, today);
      
      if (result.success && result.data) {
        setTodaysMood(result.data);
        setSelectedMood(result.data.moodScore);
        setNotes(result.data.notes || '');
      }
    } catch (error) {
      console.error('Error checking existing mood:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleMoodSelect = (moodScore: number) => {
    setSelectedMood(moodScore);
    
    // Scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSaveMood = async () => {
    if (!currentUser?.id || selectedMood === null) {
      Alert.alert('Error', 'Please select a mood before saving.');
      return;
    }

    try {
      setLoading(true);

      let result;
      if (todaysMood) {
        // Update existing mood
        result = await moodQueries.updateMoodEntry(todaysMood.id, {
          moodScore: selectedMood,
          notes,
          activityContext: 'manual_log',
        });
      } else {
        // Create new mood entry
        result = await moodQueries.createMoodEntry(
          currentUser.id,
          selectedMood,
          notes,
          'manual_log'
        );
      }

      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          todaysMood 
            ? 'Your mood has been updated for today.'
            : 'Your mood has been logged for today.',
          [
            {
              text: 'View Calendar',
              onPress: () => router.push('/mood/calendar'),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save mood entry.');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
  ];

  const cardStyle = [
    styles.card,
    isDarkMode && styles.darkCard,
  ];

  const textStyle = [
    styles.text,
    isDarkMode && styles.darkText,
  ];

  const titleStyle = [
    styles.title,
    isDarkMode && styles.darkTitle,
  ];

  const subtitleStyle = [
    styles.subtitle,
    isDarkMode && styles.darkSubtitle,
  ];

  if (checkingExisting) {
    return (
      <View style={[containerStyle, styles.loadingContainer]}>
        <Text style={textStyle}>Loading...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={titleStyle}>
            {todaysMood ? 'Update Your Mood' : 'How are you feeling?'}
          </Text>
          <Text style={subtitleStyle}>
            {todaysMood 
              ? 'You can update your mood for today'
              : 'Take a moment to check in with yourself'
            }
          </Text>
        </View>

        {/* Mood Options */}
        <View style={cardStyle}>
          <Text style={[textStyle, styles.sectionTitle]}>Select your mood</Text>
          <View style={styles.moodGrid}>
            {moodOptions.map((mood) => {
              const isSelected = selectedMood === mood.score;
              return (
                <TouchableOpacity
                  key={mood.score}
                  style={[
                    styles.moodOption,
                    isSelected && styles.selectedMoodOption,
                    { borderColor: mood.color },
                    isSelected && { backgroundColor: mood.color + '20' },
                  ]}
                  onPress={() => handleMoodSelect(mood.score)}
                >
                  <Animated.View
                    style={[
                      styles.moodContent,
                      isSelected && { transform: [{ scale: scaleAnim }] },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        isDarkMode && styles.darkMoodLabel,
                        isSelected && { color: mood.color, fontWeight: 'bold' },
                      ]}
                    >
                      {mood.displayName}
                    </Text>
                    <View style={[styles.moodScore, { backgroundColor: mood.color }]}>
                      <Text style={styles.moodScoreText}>{mood.score}</Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes Section */}
        <View style={cardStyle}>
          <Text style={[textStyle, styles.sectionTitle]}>
            Add a note (optional)
          </Text>
          <Text style={[subtitleStyle, styles.notesDescription]}>
            What contributed to your mood today?
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              isDarkMode && styles.darkNotesInput,
            ]}
            multiline
            numberOfLines={4}
            placeholder="e.g., Had a great meeting, felt stressed about deadlines, enjoyed time with friends..."
            placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
          />
          <Text style={[subtitleStyle, styles.characterCount]}>
            {notes.length}/500 characters
          </Text>
        </View>

        {/* Mood Insights */}
        {selectedMood && (
          <View style={cardStyle}>
            <Text style={[textStyle, styles.sectionTitle]}>Mood Insight</Text>
            <View style={styles.insightRow}>
              <Text style={styles.insightEmoji}>
                {moodOptions.find(m => m.score === selectedMood)?.emoji}
              </Text>
              <View style={styles.insightText}>
                <Text style={[textStyle, styles.insightTitle]}>
                  {moodOptions.find(m => m.score === selectedMood)?.displayName}
                </Text>
                <Text style={subtitleStyle}>
                  {getMoodInsight(selectedMood)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !selectedMood && styles.disabledButton,
            ]}
            onPress={handleSaveMood}
            disabled={loading || selectedMood === null}
          >
            <Ionicons 
              name={todaysMood ? "checkmark-circle" : "heart"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.saveButtonText}>
              {loading 
                ? 'Saving...' 
                : todaysMood 
                  ? 'Update Mood' 
                  : 'Log Mood'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => router.push('/mood/calendar')}
          >
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.calendarButtonText}>View Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function getMoodInsight(moodScore: number): string {
  switch (moodScore) {
    case 1:
      return "It's okay to have difficult days. Consider reaching out to someone you trust or doing a small activity that usually brings you comfort.";
    case 2:
      return "Some days are harder than others. Try to be kind to yourself and remember that this feeling is temporary.";
    case 3:
      return "You're doing okay today. Sometimes neutral is perfectly fine - not every day needs to be amazing.";
    case 4:
      return "Great to see you're feeling positive! What's going well today that you can appreciate?";
    case 5:
      return "Wonderful! You're having a great day. Take a moment to savor this feeling and maybe note what's contributing to it.";
    default:
      return "Thank you for checking in with yourself today.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  darkSubtitle: {
    color: '#CCCCCC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#2A2A2A',
  },
  text: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  darkText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: (width - 80) / 2,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  selectedMoodOption: {
    borderWidth: 2,
  },
  moodContent: {
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  darkMoodLabel: {
    color: '#FFFFFF',
  },
  moodScore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notesDescription: {
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  darkNotesInput: {
    borderColor: '#444444',
    backgroundColor: '#333333',
    color: '#FFFFFF',
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  calendarButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});