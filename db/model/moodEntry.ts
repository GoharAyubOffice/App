import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type MoodLabel = 
  | 'very_sad'
  | 'sad'
  | 'neutral'
  | 'happy'
  | 'very_happy';

export interface MoodMetadata {
  tags?: string[];
  location?: string;
  weather?: string;
  energy_level?: number;
  stress_level?: number;
}

export class MoodEntry extends Model {
  static table = 'mood_entries';

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @field('mood_score') moodScore!: number; // 1-5 scale
  @field('mood_label') moodLabel!: MoodLabel;
  @field('notes') notes!: string;
  @date('logged_at') loggedAt!: Date;
  @field('activity_context') activityContext!: string;
  @field('metadata') metadata!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  // Helper methods
  get parsedMetadata(): MoodMetadata {
    try {
      return this.metadata ? JSON.parse(this.metadata) : {};
    } catch {
      return {};
    }
  }

  get moodEmoji(): string {
    switch (this.moodLabel) {
      case 'very_sad': return '😢';
      case 'sad': return '😔';
      case 'neutral': return '😐';
      case 'happy': return '😊';
      case 'very_happy': return '😄';
      default: return '😐';
    }
  }

  get moodDisplayName(): string {
    switch (this.moodLabel) {
      case 'very_sad': return 'Very Sad';
      case 'sad': return 'Sad';
      case 'neutral': return 'Neutral';
      case 'happy': return 'Happy';
      case 'very_happy': return 'Very Happy';
      default: return 'Unknown';
    }
  }

  get moodColor(): string {
    switch (this.moodLabel) {
      case 'very_sad': return '#FF4444';
      case 'sad': return '#FF8A80';
      case 'neutral': return '#9E9E9E';
      case 'happy': return '#81C784';
      case 'very_happy': return '#4CAF50';
      default: return '#9E9E9E';
    }
  }

  static getMoodLabelFromScore(score: number): MoodLabel {
    if (score <= 1) return 'very_sad';
    if (score <= 2) return 'sad';
    if (score <= 3) return 'neutral';
    if (score <= 4) return 'happy';
    return 'very_happy';
  }

  static getMoodOptions(): Array<{
    score: number;
    label: MoodLabel;
    emoji: string;
    displayName: string;
    color: string;
  }> {
    return [
      { score: 1, label: 'very_sad', emoji: '😢', displayName: 'Very Sad', color: '#FF4444' },
      { score: 2, label: 'sad', emoji: '😔', displayName: 'Sad', color: '#FF8A80' },
      { score: 3, label: 'neutral', emoji: '😐', displayName: 'Neutral', color: '#9E9E9E' },
      { score: 4, label: 'happy', emoji: '😊', displayName: 'Happy', color: '#81C784' },
      { score: 5, label: 'very_happy', emoji: '😄', displayName: 'Very Happy', color: '#4CAF50' },
    ];
  }
}