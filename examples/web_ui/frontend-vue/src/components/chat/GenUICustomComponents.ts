import { defineComponent, ref, reactive, provide, inject, h, computed, watch } from 'vue';
import type { PropType } from 'vue';
import TinyInputOrigin from '@opentiny/vue-input';
import TinyFormOrigin from '@opentiny/vue-form';
import TinyFormItemOrigin from '@opentiny/vue-form-item';
import TinyButtonOrigin from '@opentiny/vue-button';
import TinyNumericOrigin from '@opentiny/vue-numeric';

const FORM_KEY = Symbol('genui-form');

interface FormContext {
  model: Record<string, any>;
  fields: Record<string, { prop: string; el: any }>;
  registerField: (prop: string, el: any) => void;
  unregisterField: (prop: string) => void;
}

const GenuiTinyForm = defineComponent({
  name: 'GenuiTinyForm',
  props: {
    model: { type: [Object, String] as PropType<Record<string, any> | string>, default: () => ({}) },
    labelWidth: { type: [String, Number], default: '100px' },
    labelPosition: { type: String, default: 'right' },
  },
  setup(props, { slots }) {
    const formModel = reactive<Record<string, any>>(
      typeof props.model === 'object' ? { ...props.model } : {}
    );
    const fields: Record<string, { prop: string; el: any }> = {};

    const registerField = (prop: string, el: any) => {
      fields[prop] = { prop, el };
    };
    const unregisterField = (prop: string) => {
      delete fields[prop];
    };

    provide(FORM_KEY, { model: formModel, fields, registerField, unregisterField });

    return () => h(
      TinyFormOrigin,
      {
        model: formModel,
        labelWidth: props.labelWidth,
        labelPosition: props.labelPosition,
      },
      () => slots.default?.()
    );
  },
});

const GenuiTinyFormItem = defineComponent({
  name: 'GenuiTinyFormItem',
  props: {
    label: { type: String, default: '' },
    prop: { type: String, default: '' },
    required: { type: Boolean, default: false },
    rules: { type: [Object, Array] as PropType<any>, default: undefined },
  },
  setup(props, { slots }) {
    return () => h(
      TinyFormItemOrigin,
      {
        label: props.label,
        prop: props.prop,
        required: props.required,
        rules: props.rules,
      },
      () => slots.default?.()
    );
  },
});

const GenuiTinyInput = defineComponent({
  name: 'GenuiTinyInput',
  props: {
    modelValue: { type: [String, Number], default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    size: { type: String, default: 'default' },
    clearable: { type: Boolean, default: false },
    showPassword: { type: Boolean, default: false },
    rows: { type: Number, default: undefined },
    autosize: { type: [Boolean, Object] as PropType<boolean | { minRows?: number; maxRows?: number }>, default: undefined },
    prop: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const formCtx = inject<FormContext | null>(FORM_KEY, null);
    const localValue = ref(props.modelValue);

    const value = computed({
      get() {
        if (formCtx && props.prop && props.prop in formCtx.model) {
          return formCtx.model[props.prop];
        }
        return localValue.value;
      },
      set(val: any) {
        if (formCtx && props.prop) {
          formCtx.model[props.prop] = val;
        }
        localValue.value = val;
        emit('update:modelValue', val);
      },
    });

    watch(() => props.modelValue, (v) => { localValue.value = v; });

    return () => h(
      TinyInputOrigin,
      {
        modelValue: value.value,
        'onUpdate:modelValue': (v: any) => { value.value = v; },
        type: props.type,
        placeholder: props.placeholder,
        disabled: props.disabled,
        readonly: props.readonly,
        ...(props.size && props.size !== 'default' ? { size: props.size } : {}),
        clearable: props.clearable,
        showPassword: props.showPassword,
        rows: props.rows,
        autosize: props.autosize,
      },
    );
  },
});

const GenuiTinyButton = defineComponent({
  name: 'GenuiTinyButton',
  props: {
    text: { type: String, default: '' },
    type: { type: String, default: 'default' },
    size: { type: String, default: 'default' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    plain: { type: Boolean, default: false },
    round: { type: Boolean, default: false },
    circle: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    style: { type: [String, Object] as PropType<string | Record<string, any>>, default: undefined },
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const formCtx = inject<FormContext | null>(FORM_KEY, null);

    const handleClick = (e: Event) => {
      emit('click', e);
      if (formCtx) {
        console.log('Form submitted:', { ...formCtx.model });
      }
    };

    return () => h(
      TinyButtonOrigin,
      {
        type: props.type,
        ...(props.size && props.size !== 'default' ? { size: props.size } : {}),
        disabled: props.disabled,
        loading: props.loading,
        plain: props.plain,
        round: props.round,
        circle: props.circle,
        icon: props.icon,
        style: props.style,
        onClick: handleClick,
      },
      () => slots.default?.() || (props.text ? [h('span', null, props.text)] : []),
    );
  },
});

const GenuiTinyNumeric = defineComponent({
  name: 'GenuiTinyNumeric',
  props: {
    modelValue: { type: [Number, String], default: 0 },
    min: { type: Number, default: -Infinity },
    max: { type: Number, default: Infinity },
    step: { type: Number, default: 1 },
    precision: { type: Number, default: undefined },
    disabled: { type: Boolean, default: false },
    size: { type: String, default: 'default' },
    controls: { type: Boolean, default: true },
    prop: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const formCtx = inject<FormContext | null>(FORM_KEY, null);
    const localValue = ref(props.modelValue);

    const value = computed({
      get() {
        if (formCtx && props.prop && props.prop in formCtx.model) {
          return formCtx.model[props.prop];
        }
        return localValue.value;
      },
      set(val: any) {
        if (formCtx && props.prop) {
          formCtx.model[props.prop] = val;
        }
        localValue.value = val;
        emit('update:modelValue', val);
      },
    });

    watch(() => props.modelValue, (v) => { localValue.value = v; });

    return () => h(
      TinyNumericOrigin,
      {
        modelValue: value.value,
        'onUpdate:modelValue': (v: any) => { value.value = v; },
        min: props.min,
        max: props.max,
        step: props.step,
        precision: props.precision,
        disabled: props.disabled,
        ...(props.size && props.size !== 'default' ? { size: props.size } : {}),
        controls: props.controls,
      },
    );
  },
});

export const genuiCustomComponents = {
  TinyForm: GenuiTinyForm,
  TinyFormItem: GenuiTinyFormItem,
  TinyInput: GenuiTinyInput,
  TinyButton: GenuiTinyButton,
  TinyNumeric: GenuiTinyNumeric,
};
