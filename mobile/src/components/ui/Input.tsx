import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  ReactNode,
} from 'react-native';
import { COLORS } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
  prefixElement?: ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, prefix, prefixElement, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputError : styles.inputNormal]}>
        {prefixElement ?? (prefix ? <Text style={styles.prefix}>{prefix}</Text> : null)}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.disabled}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: COLORS.surface,
  },
  inputNormal: {
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  prefix: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginEnd: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  error: {
    fontSize: 12,
    color: COLORS.danger,
  },
});
