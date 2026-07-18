import { useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../../constants';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export function OtpInput({ length = 6, value, onChange }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.container}>
      {/* Cellules d'affichage — Text uniquement, pas de TextInput */}
      {digits.map((digit, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            digit ? styles.cellFilled : styles.cellEmpty,
            index === value.length && styles.cellActive,
          ]}
        >
          <Text style={styles.cellText}>{digit}</Text>
        </View>
      ))}

      {/* Input caché qui reçoit toute la saisie clavier */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const clean = text.replace(/\D/g, '').slice(0, length);
          onChange(clean);
        }}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        autoFocus
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellEmpty: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cellFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#EBF5FB',
  },
  cellActive: {
    borderColor: COLORS.primaryLight,
    borderWidth: 2,
  },
  cellText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
