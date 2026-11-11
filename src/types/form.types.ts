/**
 * KIỂU DỮ LIỆU CHO HỆ THỐNG FORM VÀ VALIDATION DÙNG CHUNG
 */

export type ValidationRule<TValue = unknown, TForm extends object = Record<string, unknown>> = {
  required?: boolean;
  requiredMessage?: string;
  minLength?: {
    value: number;
    message: string;
  };
  maxLength?: {
    value: number;
    message: string;
  };
  min?: {
    value: number;
    message: string;
  };
  max?: {
    value: number;
    message: string;
  };
  pattern?: {
    regex: RegExp;
    message: string;
  };
  custom?: (value: TValue, allValues: TForm) => string | undefined;
};

export type ValidationSchema<TForm extends object> = {
  [K in keyof TForm]?: ValidationRule<TForm[K], TForm>;
};

export type FormErrors<TForm extends object> = {
  [K in keyof TForm]?: string;
};

