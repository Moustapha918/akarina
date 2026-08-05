import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants';
import { formatDate } from '../../utils/format';

interface DateInputProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  maximumDate,
  minimumDate,
}: DateInputProps) {
  const { t } = useTranslation();
  const [showIosPicker, setShowIosPicker] = useState(false);
  const initialValue = value ?? maximumDate ?? new Date();

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialValue,
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (_event, selectedDate) => {
          if (selectedDate) onChange(selectedDate);
        },
      });
    } else {
      setShowIosPicker(true);
    }
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.inputRow, error ? styles.inputError : styles.inputNormal]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showIosPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowIosPicker(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShowIosPicker(false)}>
                  <Text style={styles.sheetDone}>{t('common.done')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={initialValue}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={(_event, selectedDate) => {
                  if (selectedDate) onChange(selectedDate);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
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
  inputNormal: { borderColor: COLORS.border },
  inputError: { borderColor: COLORS.danger },
  value: { fontSize: 16, color: COLORS.textPrimary },
  placeholder: { fontSize: 16, color: COLORS.disabled },
  error: { fontSize: 12, color: COLORS.danger },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetDone: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    paddingHorizontal: 8,
  },
});
