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
import { COLORS } from '../src/constants';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { Button } from '../src/components/ui/Button';

const { width } = Dimensions.get('window');

// ─── Données des slides ──────────────────────────────────────────────────────

const SLIDES = [
  {
    id: '1',
    emoji: '🏗️',
    tag: null,
    title: 'Investissez dans\nl\'immobilier mauritanien',
    description:
      'Akarina vous permet de co-investir dans des projets immobiliers sélectionnés en Mauritanie, depuis votre téléphone, en toute simplicité.',
    highlight: null,
    steps: null,
    projectCard: {
      title: 'Résidence Al Nour — Nouakchott',
      location: 'Tevragh Zeina',
      collected: 3_200_000,
      target: 5_000_000,
      roi: 15,
      duration: 18,
    },
  },
  {
    id: '2',
    emoji: '🤝',
    tag: '✓ Conforme Sharia',
    title: 'Partenariat Halal\navec Mousharaka',
    description:
      'Chaque investissement est structuré selon un contrat de partenariat islamique (Mousharaka). Vous devenez co-propriétaire du projet et partagez les bénéfices à terme.',
    highlight: {
      label: 'Rendement estimé (à titre d\'exemple)',
      value: '12 – 18 %',
      note: 'Les rendements réels varient selon les projets',
    },
    steps: null,
    projectCard: null,
  },
  {
    id: '3',
    emoji: '⚡',
    tag: null,
    title: 'Investissez en\n3 minutes',
    description:
      'Un processus simple et guidé, du choix du projet au paiement via Bankily.',
    highlight: {
      label: 'Investissement minimum (à titre d\'exemple)',
      value: '1 000 MRU',
      note: 'Accessible à tous les Mauritaniens',
    },
    steps: ['Choisissez un projet', 'Signez votre contrat Mousharaka', 'Payez via Bankily', 'Suivez le chantier en temps réel'],
    projectCard: null,
  },
];

// ─── Composant projet card ────────────────────────────────────────────────────

function ProjectCard({ card }: { card: NonNullable<(typeof SLIDES)[0]['projectCard']> }) {
  const progress = card.collected / card.target;
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.imagePlaceholder}>
        <Text style={cardStyles.imagePlaceholderText}>📸 Photo du projet</Text>
      </View>
      <View style={cardStyles.body}>
        <Text style={cardStyles.title}>{card.title}</Text>
        <Text style={cardStyles.location}>📍 {card.location}</Text>
        <View style={cardStyles.progressBar}>
          <View style={[cardStyles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={cardStyles.stats}>
          <Text style={cardStyles.stat}>
            <Text style={cardStyles.statValue}>{(card.collected / 1000).toFixed(0)}k </Text>
            <Text style={cardStyles.statLabel}>MRU collectés</Text>
          </Text>
          <Text style={cardStyles.stat}>
            <Text style={cardStyles.statValue}>{card.roi}% </Text>
            <Text style={cardStyles.statLabel}>/ {card.duration} mois*</Text>
          </Text>
        </View>
        <Text style={cardStyles.disclaimer}>* À titre d'exemple</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#D6EAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  body: { padding: 16 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  location: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  progressBar: {
    height: 6,
    backgroundColor: '#D5D8DC',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {},
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  disclaimer: { fontSize: 10, color: COLORS.disabled, marginTop: 8 },
});

// ─── Slide individuelle ───────────────────────────────────────────────────────

function Slide({ item }: { item: (typeof SLIDES)[number] }) {
  return (
    <View style={[slideStyles.container, { width }]}>
      <Text style={slideStyles.emoji}>{item.emoji}</Text>

      {item.tag && (
        <View style={slideStyles.tagBadge}>
          <Text style={slideStyles.tagText}>{item.tag}</Text>
        </View>
      )}

      <Text style={slideStyles.title}>{item.title}</Text>
      <Text style={slideStyles.description}>{item.description}</Text>

      {item.projectCard && <ProjectCard card={item.projectCard} />}

      {item.highlight && (
        <View style={slideStyles.highlightBox}>
          <Text style={slideStyles.highlightLabel}>{item.highlight.label}</Text>
          <Text style={slideStyles.highlightValue}>{item.highlight.value}</Text>
          <Text style={slideStyles.highlightNote}>{item.highlight.note}</Text>
        </View>
      )}

      {item.steps && (
        <View style={slideStyles.stepsContainer}>
          {item.steps.map((step, i) => (
            <View key={i} style={slideStyles.stepRow}>
              <View style={slideStyles.stepNumber}>
                <Text style={slideStyles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={slideStyles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const slideStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D5F5E3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  tagText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  highlightBox: {
    marginTop: 24,
    backgroundColor: '#EBF5FB',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  highlightNote: {
    fontSize: 11,
    color: COLORS.disabled,
  },
  stepsContainer: {
    marginTop: 24,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { markDone } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;

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
        {!isLast && <Text style={styles.skipText}>Passer</Text>}
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
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
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* CTA */}
        <Button
          label={isLast ? 'Découvrir les projets' : 'Suivant'}
          onPress={handleNext}
          style={styles.ctaButton}
        />

        {/* Login link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
          <Text style={styles.loginText}>
            Déjà un compte ?{' '}
            <Text style={styles.loginLink}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 8,
    minHeight: 48,
  },
  skipText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  ctaButton: {},
  loginRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
