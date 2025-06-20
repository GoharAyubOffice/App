import tutorialsData from '../assets/tutorials/index.json';

export interface TutorialCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface TutorialSection {
  title: string;
  content: string;
  type: 'text' | 'list' | 'steps';
}

export interface TutorialContent {
  introduction: string;
  sections: TutorialSection[];
  tips: string[];
  nextSteps: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
  content: TutorialContent;
}

export interface TutorialLibrary {
  version: string;
  lastUpdated: string;
  categories: TutorialCategory[];
  tutorials: Tutorial[];
}

export interface SearchFilters {
  category?: string;
  difficulty?: string;
  tags?: string[];
}

export interface SearchResult {
  tutorial: Tutorial;
  relevanceScore: number;
  matchingFields: string[];
}

export class ContentLibrary {
  private static instance: ContentLibrary;
  private library: TutorialLibrary;

  constructor() {
    this.library = tutorialsData as TutorialLibrary;
  }

  static getInstance(): ContentLibrary {
    if (!ContentLibrary.instance) {
      ContentLibrary.instance = new ContentLibrary();
    }
    return ContentLibrary.instance;
  }

  /**
   * Get all tutorial categories
   */
  getCategories(): TutorialCategory[] {
    return this.library.categories;
  }

  /**
   * Get all tutorials
   */
  getAllTutorials(): Tutorial[] {
    return this.library.tutorials;
  }

  /**
   * Get tutorial by ID
   */
  getTutorialById(id: string): Tutorial | null {
    return this.library.tutorials.find(tutorial => tutorial.id === id) || null;
  }

  /**
   * Get tutorials by category
   */
  getTutorialsByCategory(categoryId: string): Tutorial[] {
    return this.library.tutorials.filter(tutorial => tutorial.category === categoryId);
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): TutorialCategory | null {
    return this.library.categories.find(category => category.id === id) || null;
  }

  /**
   * Search tutorials with query and filters
   */
  searchTutorials(
    query: string = '',
    filters: SearchFilters = {}
  ): SearchResult[] {
    let tutorials = this.library.tutorials;

    // Apply filters first
    if (filters.category) {
      tutorials = tutorials.filter(tutorial => tutorial.category === filters.category);
    }

    if (filters.difficulty) {
      tutorials = tutorials.filter(tutorial => tutorial.difficulty === filters.difficulty);
    }

    if (filters.tags && filters.tags.length > 0) {
      tutorials = tutorials.filter(tutorial =>
        filters.tags!.some(tag => tutorial.tags.includes(tag))
      );
    }

    // If no query, return filtered results with default relevance
    if (!query.trim()) {
      return tutorials.map(tutorial => ({
        tutorial,
        relevanceScore: 1.0,
        matchingFields: [],
      }));
    }

    // Perform search with relevance scoring
    const searchResults: SearchResult[] = [];
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);

    for (const tutorial of tutorials) {
      const result = this.calculateRelevance(tutorial, queryLower, queryWords);
      if (result.relevanceScore > 0) {
        searchResults.push(result);
      }
    }

    // Sort by relevance score (descending)
    return searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score for a tutorial against search query
   */
  private calculateRelevance(
    tutorial: Tutorial,
    queryLower: string,
    queryWords: string[]
  ): SearchResult {
    let score = 0;
    const matchingFields: string[] = [];

    // Title matches (highest weight)
    const titleLower = tutorial.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 10;
      matchingFields.push('title');
    } else {
      const titleWords = titleLower.split(/\s+/);
      const titleMatches = queryWords.filter(word => 
        titleWords.some(titleWord => titleWord.includes(word))
      ).length;
      score += titleMatches * 5;
      if (titleMatches > 0) matchingFields.push('title');
    }

    // Description matches
    const descriptionLower = tutorial.description.toLowerCase();
    if (descriptionLower.includes(queryLower)) {
      score += 5;
      matchingFields.push('description');
    } else {
      const descWords = descriptionLower.split(/\s+/);
      const descMatches = queryWords.filter(word => 
        descWords.some(descWord => descWord.includes(word))
      ).length;
      score += descMatches * 2;
      if (descMatches > 0) matchingFields.push('description');
    }

    // Tag matches
    const tagMatches = tutorial.tags.filter(tag => 
      tag.toLowerCase().includes(queryLower) ||
      queryWords.some(word => tag.toLowerCase().includes(word))
    );
    score += tagMatches.length * 3;
    if (tagMatches.length > 0) matchingFields.push('tags');

    // Content matches (lower weight due to volume)
    const contentText = this.extractContentText(tutorial.content).toLowerCase();
    if (contentText.includes(queryLower)) {
      score += 2;
      matchingFields.push('content');
    } else {
      const contentWords = contentText.split(/\s+/);
      const contentMatches = queryWords.filter(word => 
        contentWords.some(contentWord => contentWord.includes(word))
      ).length;
      score += contentMatches * 0.5;
      if (contentMatches > 0) matchingFields.push('content');
    }

    // Category name matches
    const category = this.getCategoryById(tutorial.category);
    if (category) {
      const categoryLower = category.title.toLowerCase();
      if (categoryLower.includes(queryLower)) {
        score += 3;
        matchingFields.push('category');
      }
    }

    // Difficulty matches
    if (tutorial.difficulty.toLowerCase().includes(queryLower)) {
      score += 1;
      matchingFields.push('difficulty');
    }

    return {
      tutorial,
      relevanceScore: score,
      matchingFields: [...new Set(matchingFields)], // Remove duplicates
    };
  }

  /**
   * Extract searchable text from tutorial content
   */
  private extractContentText(content: TutorialContent): string {
    const textParts: string[] = [];
    
    textParts.push(content.introduction);
    
    content.sections.forEach(section => {
      textParts.push(section.title);
      textParts.push(section.content);
    });
    
    textParts.push(...content.tips);
    textParts.push(...content.nextSteps);
    
    return textParts.join(' ');
  }

  /**
   * Get available difficulty levels
   */
  getDifficultyLevels(): string[] {
    const difficulties = new Set(this.library.tutorials.map(t => t.difficulty));
    return Array.from(difficulties).sort();
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const allTags = new Set<string>();
    this.library.tutorials.forEach(tutorial => {
      tutorial.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }

  /**
   * Get recommended tutorials based on user progress or category
   */
  getRecommendedTutorials(
    completedTutorialIds: string[] = [],
    preferredCategory?: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Tutorial[] {
    let tutorials = this.library.tutorials.filter(
      tutorial => !completedTutorialIds.includes(tutorial.id)
    );

    // Filter by preferred category if specified
    if (preferredCategory) {
      tutorials = tutorials.filter(tutorial => tutorial.category === preferredCategory);
    }

    // Prioritize tutorials appropriate for user level
    const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const currentLevelIndex = levelOrder[userLevel];

    tutorials.sort((a, b) => {
      const aDiff = Math.abs(levelOrder[a.difficulty] - currentLevelIndex);
      const bDiff = Math.abs(levelOrder[b.difficulty] - currentLevelIndex);
      return aDiff - bDiff;
    });

    return tutorials.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Get tutorial statistics
   */
  getLibraryStats(): {
    totalTutorials: number;
    categoryCounts: Record<string, number>;
    difficultyCounts: Record<string, number>;
    averageEstimatedTime: number;
    lastUpdated: string;
  } {
    const categoryCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    let totalMinutes = 0;

    this.library.tutorials.forEach(tutorial => {
      // Count by category
      categoryCounts[tutorial.category] = (categoryCounts[tutorial.category] || 0) + 1;
      
      // Count by difficulty
      difficultyCounts[tutorial.difficulty] = (difficultyCounts[tutorial.difficulty] || 0) + 1;
      
      // Calculate total time (extract minutes from "X min" format)
      const timeMatch = tutorial.estimatedTime.match(/(\d+)\s*min/);
      if (timeMatch) {
        totalMinutes += parseInt(timeMatch[1], 10);
      }
    });

    return {
      totalTutorials: this.library.tutorials.length,
      categoryCounts,
      difficultyCounts,
      averageEstimatedTime: Math.round(totalMinutes / this.library.tutorials.length),
      lastUpdated: this.library.lastUpdated,
    };
  }

  /**
   * Get library version info
   */
  getVersionInfo(): { version: string; lastUpdated: string } {
    return {
      version: this.library.version,
      lastUpdated: this.library.lastUpdated,
    };
  }
}

// Export singleton instance
export const contentLibrary = ContentLibrary.getInstance();