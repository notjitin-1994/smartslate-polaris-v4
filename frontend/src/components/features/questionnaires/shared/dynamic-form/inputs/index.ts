// Base components
export { InputWrapper, BaseInputField } from './BaseInput';

// Basic input components
export { default as TextInput } from './TextInput';
export { default as TextareaInput } from './TextareaInput';
export { default as SelectInput } from './SelectInput';
export { default as MultiselectInput } from './MultiselectInput';
export { default as ScaleInput } from './ScaleInput';
export { default as NumberInput } from './NumberInput';
export { default as DateInput } from './DateInput';
export { default as EmailInput } from './EmailInput';
export { default as UrlInput } from './UrlInput';

// Rich input components
export {
  RadioPillsInput,
  RadioCardsInput,
  CheckboxPillsInput,
  CheckboxCardsInput,
  EnhancedScaleInput,
  LabeledSliderInput,
  ToggleSwitchInput,
  CurrencyInputComponent,
  NumberSpinnerInput,
} from './RichInputs';

// Input component mapping using registry
import { InputType } from '@/lib/dynamic-form';
import { inputRegistry } from '@/lib/dynamic-form/inputRegistry';
import TextInput from './TextInput';
import TextareaInput from './TextareaInput';
import SelectInput from './SelectInput';
import MultiselectInput from './MultiselectInput';
import ScaleInput from './ScaleInput';
import NumberInput from './NumberInput';
import DateInput from './DateInput';
import EmailInput from './EmailInput';
import UrlInput from './UrlInput';
import {
  RadioPillsInput,
  RadioCardsInput,
  CheckboxPillsInput,
  CheckboxCardsInput,
  EnhancedScaleInput,
  LabeledSliderInput,
  ToggleSwitchInput,
  CurrencyInputComponent,
  NumberSpinnerInput,
} from './RichInputs';

// Register all known input types
inputRegistry.registerBatch([
  // Basic inputs
  { type: 'text', component: TextInput },
  { type: 'textarea', component: TextareaInput },
  { type: 'select', component: SelectInput },
  { type: 'multiselect', component: MultiselectInput },
  { type: 'scale', component: ScaleInput },
  { type: 'number', component: NumberInput },
  { type: 'date', component: DateInput },
  { type: 'email', component: EmailInput },
  { type: 'url', component: UrlInput },
  // Rich visual inputs
  { type: 'radio_pills', component: RadioPillsInput },
  { type: 'radio_cards', component: RadioCardsInput },
  { type: 'checkbox_pills', component: CheckboxPillsInput },
  { type: 'checkbox_cards', component: CheckboxCardsInput },
  { type: 'enhanced_scale', component: EnhancedScaleInput },
  { type: 'labeled_slider', component: LabeledSliderInput },
  { type: 'toggle_switch', component: ToggleSwitchInput },
  { type: 'currency', component: CurrencyInputComponent },
  { type: 'number_spinner', component: NumberSpinnerInput },
]);

// Set fallback type
inputRegistry.setFallback('text');

/**
 * Get input component for a given type
 * Supports intelligent mapping for unknown types
 */
export const getInputComponent = (type: InputType | string) => {
  const result = inputRegistry.getWithFallback(type);

  // Enhanced debugging for scale types
  if (type === 'scale' || type === 'enhanced_scale') {
    console.log('[getInputComponent] Scale type requested:', {
      requestedType: type,
      foundInRegistry: inputRegistry.has(type),
      wasMapped: result.mapped,
      mappedFrom: result.mappedFrom,
      mappedTo: result.mappedTo,
      componentName: result.component.name || result.component.displayName,
    });
  }

  return result.component;
};

/**
 * Get input component with mapping information
 * Useful for debugging and logging
 */
export const getInputComponentWithInfo = (type: string) => {
  return inputRegistry.getWithFallback(type);
};
