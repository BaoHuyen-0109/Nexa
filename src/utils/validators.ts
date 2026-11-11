import {
  FormErrors,
  ValidationRule,
  ValidationSchema,
} from '../types/form.types';

/**
 * BỘ CÔNG CỤ KIỂM TRA DỮ LIỆU ĐẦU VÀO DÙNG CHUNG (GENERIC FORM VALIDATORS)
 * Không phụ thuộc vào bất kỳ trường dữ liệu cố định nào.
 */

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Kiểm tra một trường đơn lẻ dựa trên bộ quy tắc ValidationRule.
 */
export function validateField<
  TValue = unknown,
  TForm extends object = Record<string, unknown>
>(
  value: TValue,
  rule: ValidationRule<TValue, TForm> | undefined,
  allValues: TForm
): string | undefined {
  if (!rule) return undefined;

  if (rule.required && isEmptyValue(value)) {
    return rule.requiredMessage || 'Trường này là bắt buộc.';
  }

  // Nếu giá trị rỗng và không bắt buộc thì bỏ qua các kiểm tra tiếp theo
  if (isEmptyValue(value)) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (rule.minLength && trimmed.length < rule.minLength.value) {
      return rule.minLength.message;
    }
    if (rule.maxLength && trimmed.length > rule.maxLength.value) {
      return rule.maxLength.message;
    }
    if (rule.pattern && !rule.pattern.regex.test(trimmed)) {
      return rule.pattern.message;
    }
  }

  if (typeof value === 'number' || (typeof value === 'string' && !Number.isNaN(Number(value)))) {
    const numValue = typeof value === 'number' ? value : Number(value);
    if (rule.min !== undefined && numValue < rule.min.value) {
      return rule.min.message;
    }
    if (rule.max !== undefined && numValue > rule.max.value) {
      return rule.max.message;
    }
  }

  if (rule.custom) {
    return rule.custom(value, allValues);
  }

  return undefined;
}

/**
 * Kiểm tra toàn bộ đối tượng dữ liệu Form theo ValidationSchema.
 */
export function validateForm<TForm extends object>(
  values: TForm,
  schema: ValidationSchema<TForm>
): { isValid: boolean; errors: FormErrors<TForm> } {
  const errors: FormErrors<TForm> = {};
  let isValid = true;

  const keys = Object.keys(schema) as Array<keyof TForm>;
  for (const key of keys) {
    const rule = schema[key];
    const error = validateField(values[key], rule, values);
    if (error) {
      errors[key] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Các mẫu Regex thông dụng có thể tái sử dụng nhanh khi nhận đề thi.
 */
export const commonPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  numericOnly: /^\d+$/,
  decimalNumber: /^\d+(\.\d+)?$/,
  alphanumericCode: /^[A-Za-z0-9_-]+$/,
};

