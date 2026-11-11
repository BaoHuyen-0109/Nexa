import { useCallback, useState } from 'react';
import { FormErrors, ValidationSchema } from '../types/form.types';
import { extractErrorMessage } from '../utils/errorHandler';
import { validateField, validateForm } from '../utils/validators';

export interface UseFormOptions<TForm extends object> {
  initialValues: TForm;
  validationSchema?: ValidationSchema<TForm>;
  onSubmit: (values: TForm) => Promise<void> | void;
  onCancel?: () => void;
}

export interface UseFormReturn<TForm extends object> {
  values: TForm;
  errors: FormErrors<TForm>;
  isSubmitting: boolean;
  submitError: string | null;
  setFieldValue: <K extends keyof TForm>(field: K, value: TForm[K]) => void;
  setValues: React.Dispatch<React.SetStateAction<TForm>>;
  setFieldError: <K extends keyof TForm>(field: K, errorMsg?: string) => void;
  validate: () => boolean;
  handleSubmit: () => Promise<boolean>;
  handleCancel: () => void;
  resetForm: (newValues?: TForm) => void;
}

/**
 * HOOK QUẢN LÝ FORM VÀ VALIDATION DÙNG CHUNG
 *
 * Hỗ trợ:
 * - Kiểm tra trường bắt buộc & quy tắc dữ liệu đầu vào
 * - Hiển thị lỗi theo từng trường và lỗi tổng thể khi gửi Form
 * - Quản lý trạng thái đang gửi (isSubmitting)
 * - Xử lý sự kiện Submit & Cancel
 */
export function useForm<TForm extends object>({
  initialValues,
  validationSchema = {},
  onSubmit,
  onCancel,
}: UseFormOptions<TForm>): UseFormReturn<TForm> {
  const [values, setValues] = useState<TForm>(initialValues);
  const [errors, setErrors] = useState<FormErrors<TForm>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setFieldValue = useCallback(
    <K extends keyof TForm>(field: K, value: TForm[K]) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: value };
        if (errors[field]) {
          const fieldError = validateField(
            value,
            validationSchema[field],
            updated
          );
          setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: fieldError,
          }));
        }
        return updated;
      });
      if (submitError) {
        setSubmitError(null);
      }
    },
    [errors, submitError, validationSchema]
  );

  const setFieldError = useCallback(
    <K extends keyof TForm>(field: K, errorMsg?: string) => {
      setErrors((prev) => ({
        ...prev,
        [field]: errorMsg,
      }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const result = validateForm(values, validationSchema);
    setErrors(result.errors);
    return result.isValid;
  }, [values, validationSchema]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setSubmitError(null);
    const isValid = validate();
    if (!isValid) {
      return false;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      return true;
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, 'Không thể lưu dữ liệu. Vui lòng kiểm tra lại.')
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validate, values]);

  const resetForm = useCallback(
    (newValues?: TForm) => {
      setValues(newValues ?? initialValues);
      setErrors({});
      setSubmitError(null);
    },
    [initialValues]
  );

  const handleCancel = useCallback(() => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  }, [onCancel, resetForm]);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    setFieldValue,
    setValues,
    setFieldError,
    validate,
    handleSubmit,
    handleCancel,
    resetForm,
  };
}

