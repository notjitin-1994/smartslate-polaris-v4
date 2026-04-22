import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FormState, FormStateStore, ValidationResult } from '../types';
import { createValidationEngine, validateFormData } from '../validation';
import { FormSchema } from '../schema';

interface FormStoreState {
  // Form data
  formData: Record<string, any>;
  currentSection: string;
  completedSections: string[];

  // Form state
  isSubmitting: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Validation
  errors: Record<string, string>;
  isValid: boolean;

  // Form schema
  formSchema: FormSchema | null;
  validationEngine: any | null;
}

interface FormStoreActions {
  // Form data actions
  setFormData: (data: Record<string, any>) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  updateFormData: (updates: Record<string, any>) => void;

  // Section actions
  setCurrentSection: (sectionId: string) => void;
  nextSection: () => void;
  previousSection: () => void;
  markSectionComplete: (sectionId: string) => void;
  markSectionIncomplete: (sectionId: string) => void;

  // Form state actions
  setSubmitting: (isSubmitting: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;

  // Validation actions
  validateField: (fieldId: string, value: any) => string | null;
  validateSection: (sectionId: string) => ValidationResult;
  validateForm: () => ValidationResult;
  clearErrors: (fieldId?: string) => void;
  setErrors: (errors: Record<string, string>) => void;

  // Form management
  initializeForm: (schema: FormSchema, initialData?: Record<string, any>) => void;
  resetForm: () => void;
  getFormState: () => FormState;

  // Persistence
  saveForm: () => Promise<void>;
  loadForm: (formState: FormState) => void;
  clearForm: () => void;
}

type FormStore = FormStoreState & FormStoreActions;

export const useFormStore = create<FormStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        formData: {},
        currentSection: '',
        completedSections: [],
        isSubmitting: false,
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        saveStatus: 'idle',
        errors: {},
        isValid: false,
        formSchema: null,
        validationEngine: null,

        // Form data actions
        setFormData: (data) => {
          set({ formData: data, hasUnsavedChanges: true });
          get().validateForm();
        },

        setFieldValue: (fieldId, value) => {
          const { formData, formSchema } = get();
          const newFormData = { ...formData, [fieldId]: value };

          set({
            formData: newFormData,
            hasUnsavedChanges: true,
          });

          // Validate the specific field
          if (formSchema) {
            const error = get().validateField(fieldId, value);
            const { errors } = get();
            const newErrors = { ...errors };

            if (error) {
              newErrors[fieldId] = error;
            } else {
              delete newErrors[fieldId];
            }

            set({ errors: newErrors });
          }
        },

        updateFormData: (updates) => {
          const { formData } = get();
          const newFormData = { ...formData, ...updates };
          set({ formData: newFormData, hasUnsavedChanges: true });
          get().validateForm();
        },

        // Section actions
        setCurrentSection: (sectionId) => {
          set({ currentSection: sectionId });
        },

        nextSection: () => {
          const { formSchema, currentSection } = get();
          if (!formSchema) return;

          const currentIndex = formSchema.sections.findIndex((s) => s.id === currentSection);
          if (currentIndex < formSchema.sections.length - 1) {
            const nextSection = formSchema.sections[currentIndex + 1];
            set({ currentSection: nextSection.id });
          }
        },

        previousSection: () => {
          const { formSchema, currentSection } = get();
          if (!formSchema) return;

          const currentIndex = formSchema.sections.findIndex((s) => s.id === currentSection);
          if (currentIndex > 0) {
            const prevSection = formSchema.sections[currentIndex - 1];
            set({ currentSection: prevSection.id });
          }
        },

        markSectionComplete: (sectionId) => {
          const { completedSections } = get();
          if (!completedSections.includes(sectionId)) {
            set({ completedSections: [...completedSections, sectionId] });
          }
        },

        markSectionIncomplete: (sectionId) => {
          const { completedSections } = get();
          set({ completedSections: completedSections.filter((id) => id !== sectionId) });
        },

        // Form state actions
        setSubmitting: (isSubmitting) => set({ isSubmitting }),
        setSaving: (isSaving) => set({ isSaving }),
        setLastSaved: (lastSaved) => set({ lastSaved }),
        setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
        setSaveStatus: (saveStatus) => set({ saveStatus }),

        // Validation actions
        validateField: (fieldId, value) => {
          const { formSchema, formData } = get();
          if (!formSchema) return null;

          const engine = get().validationEngine || createValidationEngine(formSchema);
          return engine.validateField(fieldId, value, formData);
        },

        validateSection: (sectionId) => {
          const { formSchema, formData } = get();
          if (!formSchema) return { isValid: false, errors: [] };

          const engine = get().validationEngine || createValidationEngine(formSchema);
          return engine.validateSection(sectionId, formData);
        },

        validateForm: () => {
          const { formSchema, formData } = get();
          if (!formSchema) return { isValid: false, errors: [] };

          const result = validateFormData(formSchema, formData);
          set({
            errors: result.errors.reduce(
              (acc, err) => ({ ...acc, [err.fieldId]: err.message }),
              {}
            ),
            isValid: result.isValid,
          });
          return result;
        },

        clearErrors: (fieldId) => {
          const { errors } = get();
          if (fieldId) {
            const newErrors = { ...errors };
            delete newErrors[fieldId];
            set({ errors: newErrors });
          } else {
            set({ errors: {} });
          }
        },

        setErrors: (errors) => set({ errors }),

        // Form management
        initializeForm: (schema, initialData = {}) => {
          const engine = createValidationEngine(schema);
          set({
            formSchema: schema,
            validationEngine: engine,
            formData: initialData,
            currentSection: schema.sections[0]?.id || '',
            completedSections: [],
            errors: {},
            isValid: false,
            hasUnsavedChanges: false,
          });
        },

        resetForm: () => {
          const { formSchema } = get();
          set({
            formData: {},
            currentSection: formSchema?.sections[0]?.id || '',
            completedSections: [],
            errors: {},
            isValid: false,
            hasUnsavedChanges: false,
            isSubmitting: false,
            isSaving: false,
            saveStatus: 'idle',
          });
        },

        getFormState: () => {
          const { formData, currentSection, completedSections, formSchema } = get();
          return {
            formId: formSchema?.id || '',
            currentSection,
            answers: formData,
            progress: {
              completedSections,
              overallProgress: completedSections.length,
            },
            lastSaved: new Date().toISOString(),
            version: '1.0.0',
          };
        },

        // Persistence
        saveForm: async () => {
          const { formSchema, formData, currentSection, completedSections } = get();
          if (!formSchema) return;

          set({ isSaving: true, saveStatus: 'saving' });

          try {
            const formState = get().getFormState();
            const serializedData = JSON.stringify(formState);
            localStorage.setItem(`form-${formSchema.id}`, serializedData);

            set({
              lastSaved: new Date(),
              hasUnsavedChanges: false,
              saveStatus: 'saved',
            });
          } catch (error) {
            console.error('Form save failed:', error);
            set({ saveStatus: 'error' });
          } finally {
            set({ isSaving: false });
          }
        },

        loadForm: (formState) => {
          set({
            formData: formState.answers,
            currentSection: formState.currentSection || '',
            completedSections: formState.progress.completedSections,
            lastSaved: formState.lastSaved ? new Date(formState.lastSaved) : null,
            hasUnsavedChanges: false,
          });
        },

        clearForm: () => {
          const { formSchema } = get();
          if (formSchema) {
            localStorage.removeItem(`form-${formSchema.id}`);
          }
          get().resetForm();
        },
      }),
      {
        name: 'form-store',
        partialize: (state) => ({
          formData: state.formData,
          currentSection: state.currentSection,
          completedSections: state.completedSections,
          lastSaved: state.lastSaved,
        }),
      }
    ),
    {
      name: 'form-store',
    }
  )
);

// Selectors for better performance
export const useFormData = () => useFormStore((state) => state.formData);
export const useCurrentSection = () => useFormStore((state) => state.currentSection);
export const useCompletedSections = () => useFormStore((state) => state.completedSections);
export const useFormErrors = () => useFormStore((state) => state.errors);
export const useFormValidation = () =>
  useFormStore((state) => ({
    isValid: state.isValid,
    errors: state.errors,
    validateField: state.validateField,
    validateSection: state.validateSection,
    validateForm: state.validateForm,
    clearErrors: state.clearErrors,
  }));
export const useFormPersistence = () =>
  useFormStore((state) => ({
    isSaving: state.isSaving,
    lastSaved: state.lastSaved,
    hasUnsavedChanges: state.hasUnsavedChanges,
    saveStatus: state.saveStatus,
    saveForm: state.saveForm,
    loadForm: state.loadForm,
    clearForm: state.clearForm,
  }));
