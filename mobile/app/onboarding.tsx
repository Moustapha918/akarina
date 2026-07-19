import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../src/constants';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { Button } from '../src/components/ui/Button';
import { formatMRU } from '../src/utils/format';

const { width } = Dimensions.get('window');

type SlideId = '1' | '2' | '3';

const PROJECT_CARD = {
  title: 'Résidence Al Nour — Nouakchott',
  location: 'Tevragh Zeina',
  collected: 3_200_000,
  target: 5_000_000,
  roi: 15,
  duration: 18,
};

function ProjectCard() {
  const { t } = useTranslation();
  const progress = PROJECT_CARD.collected / PROJECT_CARD.target;
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.imagePlaceholder}>
        <Text style={cardStyles.imagePlaceholderText}>{t('onboarding.projectCard.photo')}</Text>
      </View>
      <View style={cardStyles.body}>
        <Text style={cardStyles.title}>{PROJECT_CARD.title}</Text>
        <Text style={cardStyles.location}>📍 {PROJECT_CARD.location}</Text>
        <View style={cardStyles.progressBar}>
          <View style={[cardStyles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={cardStyles.stats}>
          <Text style={cardStyles.stat}>
            <Text style={cardStyles.statValue}>{(PROJECT_CARD.collected / 1000).toFixed(0)}k </Text>
            <Text style={cardStyles.statLabel}>{t('onboarding.projectCard.collected')}</Text>
          </Text>
          <Text style={cardStyles.stat}>
            <Text style={cardStyles.statValue}>{PROJECT_CARD.roi}% </Text>
            <Text style={cardStyles.statLabel}>/ {PROJECT_CARD.duration} mois*</Text>
          </Text>
        </View>
        <Text style={cardStyles.disclaimer}>{t('onboarding.projectCard.disclaimer')}</Text>
      </View>
    </View>
  );
}

function Slide({ id }: { id: SlideId }) {
  const { t } = useTranslation();

  if (id === '1') {
    return (
      <View style={[slideStyles.container, { width }]}>
        <Text style={slideStyles.emoji}>🏗️</Text>
        <Text style={slideStyles.title}>{t('onboarding.slide1.title')}</Text>
        <Text style={slideStyles.description}>{t('onboarding.slide1.description')}</Text>
        <ProjectCard />
      </View>
    );
  }

  if (id === '2') {
    return (
      <View style={[slideStyles.container, { width }]}>
        <Text style={slideStyles.emoji}>🤝</Text>
        <View style={slideStyles.tagBadge}>
          <Text style={slideStyles.tagText}>{t('onboarding.slide2.tag')}</Text>
        </View>
        <Text style={slideStyles.title}>{t('onboarding.slide2.title')}</Text>
        <Text style={slideStyles.description}>{t('onboarding.slide2.description')}</Text>
        <View style={slideStyles.highlightBox}>
          <Text style={slideStyles.highlightLabel}>{t('onboarding.slide2.highlightLabel')}</Text>
          <Text style={slideStyles.highlightValue}>{t('onboarding.slide2.highlightValue')}</Text>
          <Text style={slideStyles.highlightNote}>{t('onboarding.slide2.highlightNote')}</Text>
        </View>
      </View>
    );
  }

  // slide 3
  const steps = [
    t('onboarding.slide3.step1'),
    t('onboarding.slide3.step2'),
    t('onboarding.slide3.step3'),
    t('onboarding.slide3.step4'),
  ];

  return (
    <View style={[slideStyles.container, { width }]}>
      <Text style={slideStyles.emoji}>⚡</Text>
      <Text style={slideStyles.title}>{t('onboarding.slide3.title')}</Text>
      <Text style={slideStyles.description}>{t('onboarding.slide3.description')}</Text>
      <View style={slideStyles.highlightBox}>
        <Text style={slideStyles.highlightLabel}>{t('onboarding.slide3.highlightLabel')}</Text>
        <Text style={slideStyles.highlightValue}>{t('onboarding.slide3.highlightValue')}</Text>
        <Text style={slideStyles.highlightNote}>{t('onboarding.slide3.highlightNote')}</Text>
      </View>
      <View style={slideStyles.stepsContainer}>
        {steps.map((step, i) => (
          <View key={i} style={slideStyles.stepRow}>
            <View style={slideStyles.stepNumber}>
              <Text style={slideStyles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={slideStyles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const SLIDE_IDS: SlideId[] = ['1', '2', '3'];

export default function OnboardingScreen() {
  const { markDone } = useOnboarding();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDE_IDS.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  async function handleNext() {
    if (isLast) {
      await markDone();
      router.replace('/(app)');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }

  async function handleSkip() {
    await markDone();
    router.replace('/(app)');
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      {/* Skip */}
      <TouchableOpacity
        onPress={handleSkip}
        style={[styles.skipButton, { paddingTop: insets.top + 12 }]}
      >
        {!isLast && <Text style={styles.skipText}>{t('onboarding.skip')}</Text>}
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDE_IDS}
        keyExtractor={(id) => id}
        renderItem={({ item }) => <Slide id={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={styles.flatList}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDE_IDS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* CTA */}
        <Button
          label={isLast ? t('onboarding.discover') : t('onboarding.next')}
          onPress={handleNext}
          style={styles.ctaButton}
        />

        {/* Login link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
          <Text style={styles.loginText}>
            {t('onboarding.alreadyAccount')}{' '}
            <Text style={styles.loginLink}>{t('onboarding.signIn')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    marginTop: 24, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
  },
  imagePlaceholder: { height: 120, backgroundColor: '#D6EAF8', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: COLORS.textSecondary, fontSize: 14 },
  body: { padding: 16 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  location: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#D5D8DC', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {},
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  disclaimer: { fontSize: 10, color: COLORS.disabled, marginTop: 8 },
});

const slideStyles = StyleSheet.create({
  container: { paddingHorizontal: 28, paddingTop: 8 },
  emoji: { fontSize: 52, marginBottom: 16 },
  tagBadge: {
    alignSelf: 'flex-start', backgroundColor: '#D5F5E3', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
  },
  tagText: { color: COLORS.success, fontSize: 13, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 34, marginBottom: 16 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },
  highlightBox: {
    marginTop: 24, backgroundColor: '#EBF5FB', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  highlightLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  highlightValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  highlightNote: { fontSize: 11, color: COLORS.disabled },
  stepsContainer: { marginTop: 24, gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNumber: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  skipButton: { alignSelf: 'flex-end', paddingHorizontal: 24, paddingBottom: 8, minHeight: 48 },
  skipText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  flatList: { flex: 1 },
  footer: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  dotInactive: { width: 8, backgroundColor: COLORS.border },
  ctaButton: {},
  loginRow: { alignItems: 'center', paddingVertical: 4 },
  loginText: { fontSize: 14, color: COLORS.textSecondary },
  loginLink: { color: COLORS.primary, fontWeight: '700' },
});
