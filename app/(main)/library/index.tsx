import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/hooks';
import { 
  contentLibrary, 
  Tutorial, 
  TutorialCategory, 
  SearchResult, 
  SearchFilters 
} from '../../../services/contentLibrary';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [categories, setCategories] = useState<TutorialCategory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadContent();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadContent = () => {
    const allCategories = contentLibrary.getCategories();
    setCategories(allCategories);
    performSearch();
  };

  const performSearch = () => {
    const filters: SearchFilters = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedDifficulty) filters.difficulty = selectedDifficulty;

    const results = contentLibrary.searchTutorials(searchQuery, filters);
    setSearchResults(results);
  };

  useEffect(() => {
    performSearch();
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9500';
      case 'advanced': return '#FF6B6B';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'leaf';
      case 'intermediate': return 'flash';
      case 'advanced': return 'rocket';
      default: return 'help';
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, isDarkMode && styles.darkHeader]}>
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
        Learning Library
      </Text>
      <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
        Guides and tutorials to master FlowState
      </Text>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, isDarkMode && styles.darkSearchContainer]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isDarkMode ? '#CCCCCC' : '#666666'} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.darkSearchInput]}
          placeholder="Search tutorials..."
          placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={isDarkMode ? '#CCCCCC' : '#666666'} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Controls */}
      <View style={styles.filterControls}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (selectedCategory || selectedDifficulty) && styles.activeFilterButton,
            isDarkMode && styles.darkFilterButton,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons 
            name="options" 
            size={16} 
            color={
              (selectedCategory || selectedDifficulty) 
                ? '#FFFFFF' 
                : isDarkMode ? '#CCCCCC' : '#666666'
            } 
          />
          <Text style={[
            styles.filterButtonText,
            (selectedCategory || selectedDifficulty) && styles.activeFilterButtonText,
            isDarkMode && styles.darkFilterButtonText,
          ]}>
            Filters
          </Text>
        </TouchableOpacity>

        {(selectedCategory || selectedDifficulty || searchQuery) && (
          <TouchableOpacity
            style={[styles.clearFiltersButton, isDarkMode && styles.darkClearFiltersButton]}
            onPress={clearSearch}
          >
            <Text style={[styles.clearFiltersText, isDarkMode && styles.darkClearFiltersText]}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCategoryCard = ({ item }: { item: TutorialCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isDarkMode && styles.darkCategoryCard,
        selectedCategory === item.id && { borderColor: item.color, borderWidth: 2 },
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={[styles.categoryTitle, isDarkMode && styles.darkCategoryTitle]}>
        {item.title}
      </Text>
      <Text style={[styles.categoryDescription, isDarkMode && styles.darkCategoryDescription]}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  const renderTutorialCard = ({ item }: { item: SearchResult }) => {
    const { tutorial } = item;
    const category = contentLibrary.getCategoryById(tutorial.category);

    return (
      <TouchableOpacity
        style={[styles.tutorialCard, isDarkMode && styles.darkTutorialCard]}
        onPress={() => setSelectedTutorial(tutorial)}
      >
        <View style={styles.tutorialHeader}>
          <View style={styles.tutorialMeta}>
            <View style={styles.difficultyBadge}>
              <Ionicons 
                name={getDifficultyIcon(tutorial.difficulty) as any} 
                size={14} 
                color={getDifficultyColor(tutorial.difficulty)} 
              />
              <Text style={[
                styles.difficultyText,
                { color: getDifficultyColor(tutorial.difficulty) }
              ]}>
                {tutorial.difficulty}
              </Text>
            </View>
            <Text style={[styles.estimatedTime, isDarkMode && styles.darkEstimatedTime]}>
              {tutorial.estimatedTime}
            </Text>
          </View>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.title}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.tutorialTitle, isDarkMode && styles.darkTutorialTitle]}>
          {tutorial.title}
        </Text>
        <Text style={[styles.tutorialDescription, isDarkMode && styles.darkTutorialDescription]}>
          {tutorial.description}
        </Text>

        {tutorial.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tutorial.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, isDarkMode && styles.darkTag]}>
                <Text style={[styles.tagText, isDarkMode && styles.darkTagText]}>
                  {tag}
                </Text>
              </View>
            ))}
            {tutorial.tags.length > 3 && (
              <Text style={[styles.moreTagsText, isDarkMode && styles.darkMoreTagsText]}>
                +{tutorial.tags.length - 3}
              </Text>
            )}
          </View>
        )}

        {item.matchingFields.length > 0 && searchQuery && (
          <View style={styles.matchInfo}>
            <Text style={[styles.matchText, isDarkMode && styles.darkMatchText]}>
              Matches: {item.matchingFields.join(', ')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
        <View style={[styles.modalHeader, isDarkMode && styles.darkModalHeader]}>
          <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>
            Filter Tutorials
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFilters(false)}
          >
            <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, isDarkMode && styles.darkFilterSectionTitle]}>
              Category
            </Text>
            <View style={styles.filterOptions}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterOption,
                    selectedCategory === category.id && styles.selectedFilterOption,
                    isDarkMode && styles.darkFilterOption,
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={20} 
                    color={selectedCategory === category.id ? '#FFFFFF' : category.color} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategory === category.id && styles.selectedFilterOptionText,
                    isDarkMode && styles.darkFilterOptionText,
                  ]}>
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, isDarkMode && styles.darkFilterSectionTitle]}>
              Difficulty
            </Text>
            <View style={styles.filterOptions}>
              {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterOption,
                    selectedDifficulty === difficulty && styles.selectedFilterOption,
                    isDarkMode && styles.darkFilterOption,
                  ]}
                  onPress={() => setSelectedDifficulty(
                    selectedDifficulty === difficulty ? null : difficulty
                  )}
                >
                  <Ionicons 
                    name={getDifficultyIcon(difficulty) as any} 
                    size={20} 
                    color={
                      selectedDifficulty === difficulty 
                        ? '#FFFFFF' 
                        : getDifficultyColor(difficulty)
                    } 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    selectedDifficulty === difficulty && styles.selectedFilterOptionText,
                    isDarkMode && styles.darkFilterOptionText,
                  ]}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalClearButton]}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedDifficulty(null);
            }}
          >
            <Text style={styles.applyButtonText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.applyButton]}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTutorialModal = () => (
    <Modal
      visible={!!selectedTutorial}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedTutorial(null)}
    >
      {selectedTutorial && (
        <View style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
          <View style={[styles.modalHeader, isDarkMode && styles.darkModalHeader]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>
              {selectedTutorial.title}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTutorial(null)}
            >
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1A1A1A'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.tutorialPreview}>
              <Text style={[styles.tutorialPreviewDescription, isDarkMode && styles.darkTutorialPreviewDescription]}>
                {selectedTutorial.description}
              </Text>
              
              <View style={styles.tutorialPreviewMeta}>
                <View style={styles.tutorialPreviewMetaItem}>
                  <Ionicons 
                    name={getDifficultyIcon(selectedTutorial.difficulty) as any} 
                    size={16} 
                    color={getDifficultyColor(selectedTutorial.difficulty)} 
                  />
                  <Text style={[styles.tutorialPreviewMetaText, isDarkMode && styles.darkTutorialPreviewMetaText]}>
                    {selectedTutorial.difficulty}
                  </Text>
                </View>
                <View style={styles.tutorialPreviewMetaItem}>
                  <Ionicons name="time" size={16} color={isDarkMode ? '#CCCCCC' : '#666666'} />
                  <Text style={[styles.tutorialPreviewMetaText, isDarkMode && styles.darkTutorialPreviewMetaText]}>
                    {selectedTutorial.estimatedTime}
                  </Text>
                </View>
              </View>

              <Text style={[styles.tutorialIntroduction, isDarkMode && styles.darkTutorialIntroduction]}>
                {selectedTutorial.content.introduction}
              </Text>

              <View style={styles.tutorialSections}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
                  What you'll learn:
                </Text>
                {selectedTutorial.content.sections.map((section, index) => (
                  <View key={index} style={styles.sectionItem}>
                    <Text style={[styles.sectionItemTitle, isDarkMode && styles.darkSectionItemTitle]}>
                      {section.title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.startButton]}
              onPress={() => {
                setSelectedTutorial(null);
                // TODO: Navigate to tutorial detail page
                // router.push(`/library/tutorial/${selectedTutorial.id}`);
              }}
            >
              <Text style={styles.startButtonText}>Start Tutorial</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
  ];

  const showingCategories = !searchQuery && !selectedCategory && !selectedDifficulty;
  const stats = contentLibrary.getLibraryStats();

  return (
    <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHeader()}

        {/* Stats Bar */}
        <View style={[styles.statsBar, isDarkMode && styles.darkStatsBar]}>
          <Text style={[styles.statsText, isDarkMode && styles.darkStatsText]}>
            {searchResults.length} tutorial{searchResults.length !== 1 ? 's' : ''} available
          </Text>
          {searchQuery && (
            <Text style={[styles.searchInfo, isDarkMode && styles.darkSearchInfo]}>
              for "{searchQuery}"
            </Text>
          )}
        </View>

        {/* Content */}
        {showingCategories ? (
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.categoryRow}
            contentContainerStyle={styles.categoriesContainer}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderTutorialCard}
            keyExtractor={(item) => item.tutorial.id}
            contentContainerStyle={styles.tutorialsContainer}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {renderFiltersModal()}
      {renderTutorialModal()}
    </Animated.View>
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
    marginBottom: 20,
  },
  darkSubtitle: {
    color: '#CCCCCC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  darkSearchContainer: {
    backgroundColor: '#333333',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  darkSearchInput: {
    color: '#FFFFFF',
  },
  clearButton: {
    padding: 4,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  darkFilterButton: {
    backgroundColor: '#333333',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  darkFilterButtonText: {
    color: '#CCCCCC',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  darkClearFiltersButton: {
    // No additional styles
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  darkClearFiltersText: {
    color: '#FF8A80',
  },
  statsBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  darkStatsBar: {
    backgroundColor: '#2A2A2A',
    borderBottomColor: '#444444',
  },
  statsText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  darkStatsText: {
    color: '#CCCCCC',
  },
  searchInfo: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  darkSearchInfo: {
    color: '#888888',
  },
  categoriesContainer: {
    padding: 16,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: (width - 48) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCategoryCard: {
    backgroundColor: '#2A2A2A',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  darkCategoryTitle: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  darkCategoryDescription: {
    color: '#CCCCCC',
  },
  tutorialsContainer: {
    padding: 16,
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkTutorialCard: {
    backgroundColor: '#2A2A2A',
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#666666',
  },
  darkEstimatedTime: {
    color: '#CCCCCC',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  darkTutorialTitle: {
    color: '#FFFFFF',
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  darkTutorialDescription: {
    color: '#CCCCCC',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  darkTag: {
    backgroundColor: '#333333',
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
  },
  darkTagText: {
    color: '#CCCCCC',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#999999',
    alignSelf: 'center',
  },
  darkMoreTagsText: {
    color: '#888888',
  },
  matchInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  matchText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  darkMatchText: {
    color: '#4A9EFF',
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
    flex: 1,
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
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  darkFilterSectionTitle: {
    color: '#FFFFFF',
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  darkFilterOption: {
    backgroundColor: '#333333',
  },
  selectedFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  darkFilterOptionText: {
    color: '#FFFFFF',
  },
  selectedFilterOptionText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalClearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tutorialPreview: {
    // Tutorial preview styles
  },
  tutorialPreviewDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 16,
  },
  darkTutorialPreviewDescription: {
    color: '#CCCCCC',
  },
  tutorialPreviewMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  tutorialPreviewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tutorialPreviewMetaText: {
    fontSize: 14,
    color: '#666666',
  },
  darkTutorialPreviewMetaText: {
    color: '#CCCCCC',
  },
  tutorialIntroduction: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 20,
  },
  darkTutorialIntroduction: {
    color: '#FFFFFF',
  },
  tutorialSections: {
    // Tutorial sections styles
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  darkSectionTitle: {
    color: '#FFFFFF',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectionItemTitle: {
    fontSize: 14,
    color: '#666666',
  },
  darkSectionItemTitle: {
    color: '#CCCCCC',
  },
});