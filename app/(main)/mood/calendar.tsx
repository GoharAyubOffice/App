import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../../store/hooks';
import { MoodCalendar } from '../../../components/mood/MoodCalendar';
import { moodQueries } from '../../../db/queries/moodQueries';
import { MoodEntry } from '../../../db/model/moodEntry';

interface SelectedMoodData {
  date: string;
  mood?: {
    mood: number;
    moodLabel: string;
    color: string;
    emoji: string;
    notes?: string;
  };
}

export default function MoodCalendarScreen() {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [selectedMoodData, setSelectedMoodData] = useState<SelectedMoodData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [todaysMoodStatus, setTodaysMoodStatus] = useState<{
    hasEntry: boolean;
    loading: boolean;
  }>({ hasEntry: false, loading: true });

  useEffect(() => {
    checkTodaysMood();
  }, [currentUser?.id]);

  const checkTodaysMood = async () => {
    if (!currentUser?.id) return;

    try {
      const result = await moodQueries.hasMoodEntryToday(currentUser.id);
      setTodaysMoodStatus({
        hasEntry: result.success && result.data?.hasEntry,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking today\'s mood:', error);
      setTodaysMoodStatus({ hasEntry: false, loading: false });
    }
  };

  const handleDateSelect = (date: string, moodData?: any) => {
    setSelectedMoodData({ date, mood: moodData });
    if (moodData) {
      setShowDetailsModal(true);
    }
  };

  const handleLogMood = () => {
    router.push('/mood/log');
  };

  const handleViewStats = () => {
    // This would navigate to a detailed stats page
    Alert.alert(
      'Mood Statistics',
      'Detailed mood analytics coming soon! For now, you can see monthly stats above the calendar.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMoodDescription = (mood: number): string => {
    switch (mood) {
      case 1: return 'It was a very difficult day.';
      case 2: return 'You were feeling down.';
      case 3: return 'You had a neutral day.';
      case 4: return 'You were feeling good!';
      case 5: return 'You had an amazing day!';
      default: return 'Unknown mood.';
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, isDarkMode && styles.darkHeader]}>
      <View style={styles.headerContent}>
        <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
          Mood Calendar
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
          Track your emotional journey over time
        </Text>
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.logButton]}
          onPress={handleLogMood}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {todaysMoodStatus.hasEntry ? 'Update' : 'Log Mood'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.statsButton]}
          onPress={handleViewStats}
        >
          <Ionicons name="analytics" size={20} color="#007AFF" />
          <Text style={[styles.statsButtonText, isDarkMode && styles.darkStatsButtonText]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTodaysBanner = () => {
    if (todaysMoodStatus.loading) return null;

    if (!todaysMoodStatus.hasEntry) {
      return (
        <TouchableOpacity
          style={[styles.todaysBanner, styles.noMoodBanner]}
          onPress={handleLogMood}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="time" size={24} color="#FF9500" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Haven't logged your mood today</Text>
              <Text style={styles.bannerSubtitle}>
                Tap here to check in with yourself
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FF9500" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.todaysBanner, styles.hasMoodBanner]}>
        <View style={styles.bannerContent}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Mood logged for today</Text>
            <Text style={styles.bannerSubtitle}>
              Great job staying consistent!
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMoodDetailsModal = () => {
    if (!selectedMoodData?.mood) return null;

    const { mood } = selectedMoodData;

    return (
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
          <View style={[styles.modalHeader, isDarkMode && styles.darkModalHeader]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>
              {formatDate(selectedMoodData.date)}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1A1A1A'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.moodCard, isDarkMode && styles.darkMoodCard]}>
              <View style={styles.moodHeader}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <View style={styles.moodInfo}>
                  <Text style={[styles.moodLabel, isDarkMode && styles.darkMoodLabel]}>
                    {mood.moodLabel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={[styles.moodDescription, isDarkMode && styles.darkMoodDescription]}>
                    {getMoodDescription(mood.mood)}
                  </Text>
                </View>
                <View style={[styles.moodScore, { backgroundColor: mood.color }]}>
                  <Text style={styles.moodScoreText}>{mood.mood}</Text>
                </View>
              </View>

              {mood.notes && (
                <View style={styles.notesSection}>
                  <Text style={[styles.notesTitle, isDarkMode && styles.darkNotesTitle]}>
                    Notes
                  </Text>
                  <Text style={[styles.notesText, isDarkMode && styles.darkNotesText]}>
                    {mood.notes}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setShowDetailsModal(false);
                  router.push('/mood/log');
                }}
              >
                <Ionicons name="create" size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit Mood</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderTodaysBanner()}
        
        <MoodCalendar
          onDateSelect={handleDateSelect}
          showStats={true}
        />
      </ScrollView>

      {renderMoodDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  darkHeader: {
    backgroundColor: '#2A2A2A',
    borderBottomColor: '#444444',
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  darkSubtitle: {
    color: '#CCCCCC',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  logButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    justifyContent: 'center',
  },
  statsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  darkStatsButtonText: {
    color: '#4A9EFF',
  },
  todaysBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noMoodBanner: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  hasMoodBanner: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#81C784',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerText: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkModalContainer: {
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  darkModalHeader: {
    borderBottomColor: '#444444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  darkModalTitle: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  moodCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  darkMoodCard: {
    backgroundColor: '#2A2A2A',
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  darkMoodLabel: {
    color: '#FFFFFF',
  },
  moodDescription: {
    fontSize: 16,
    color: '#666666',
  },
  darkMoodDescription: {
    color: '#CCCCCC',
  },
  moodScore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  moodScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 16,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  darkNotesTitle: {
    color: '#FFFFFF',
  },
  notesText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  darkNotesText: {
    color: '#FFFFFF',
  },
  modalActions: {
    paddingBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});