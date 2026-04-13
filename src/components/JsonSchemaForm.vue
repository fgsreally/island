<script setup lang="ts">
/**
 * 根据 JSON Schema（draft 2020-12 子集）渲染简单表单：string / number / integer / boolean + enum。
 * 与各插件 config 里的 pluginSettings.schema 及 islandShellSettingsSchema 配套使用。
 */
import { computed } from 'vue'

const props = defineProps<{
  schema: unknown
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

type PropSchema = {
  type?: string
  description?: string
  title?: string
  default?: unknown
  enum?: unknown[]
}

const properties = computed(() => {
  const s = props.schema
  if (!s || typeof s !== 'object') return {} as Record<string, PropSchema>
  const raw = (s as { properties?: Record<string, unknown> }).properties
  if (!raw || typeof raw !== 'object') return {} as Record<string, PropSchema>
  return raw as Record<string, PropSchema>
})

const orderedKeys = computed(() => Object.keys(properties.value))

function labelFor(key: string, ps: PropSchema): string {
  if (typeof ps.title === 'string' && ps.title) return ps.title
  return key
}

function patch(key: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function getStr(key: string, ps: PropSchema): string {
  const v = props.modelValue[key]
  if (v === undefined || v === null) return ''
  return String(v)
}

function getNum(key: string, ps: PropSchema): number | '' {
  const v = props.modelValue[key]
  if (v === undefined || v === null) {
    const d = ps.default
    if (typeof d === 'number' && Number.isFinite(d)) return d
    return ''
  }
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : ''
}

function getBool(key: string, ps: PropSchema): boolean {
  const v = props.modelValue[key]
  if (typeof v === 'boolean') return v
  if (v === undefined && typeof ps.default === 'boolean') return ps.default
  return Boolean(v)
}

function onNumInput(key: string, ps: PropSchema, raw: string) {
  if (raw === '' || raw === '-') {
    patch(key, undefined)
    return
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) return
  const t = ps.type === 'integer' ? Math.trunc(n) : n
  patch(key, t)
}

function enumOptions(ps: PropSchema): string[] {
  const e = ps.enum
  if (!Array.isArray(e)) return []
  return e.filter((x): x is string => typeof x === 'string')
}
</script>

<template>
  <div class="json-schema-form">
    <div
      v-for="key in orderedKeys"
      :key="key"
      class="json-schema-form__field"
    >
      <template v-if="properties[key]">
        <label class="json-schema-form__label" :for="`jsf-${key}`">
          {{ labelFor(key, properties[key]!) }}
        </label>
        <p v-if="properties[key]!.description" class="json-schema-form__desc">
          {{ properties[key]!.description }}
        </p>

        <!-- enum → select -->
        <select
          v-if="enumOptions(properties[key]!).length > 0"
          :id="`jsf-${key}`"
          class="json-schema-form__control json-schema-form__select"
          :value="getStr(key, properties[key]!)"
          @change="patch(key, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in enumOptions(properties[key]!)"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>

        <!-- boolean -->
        <label
          v-else-if="properties[key]!.type === 'boolean'"
          class="json-schema-form__check-wrap"
        >
          <input
            :id="`jsf-${key}`"
            type="checkbox"
            class="json-schema-form__checkbox"
            :checked="getBool(key, properties[key]!)"
            @change="patch(key, ($event.target as HTMLInputElement).checked)"
          />
          <span>启用</span>
        </label>

        <!-- number / integer -->
        <input
          v-else-if="properties[key]!.type === 'number' || properties[key]!.type === 'integer'"
          :id="`jsf-${key}`"
          class="json-schema-form__control"
          :type="'number'"
          :step="properties[key]!.type === 'integer' ? 1 : 'any'"
          :value="getNum(key, properties[key]!) === '' ? '' : getNum(key, properties[key]!)"
          @input="onNumInput(key, properties[key]!, ($event.target as HTMLInputElement).value)"
        />

        <!-- string -->
        <input
          v-else
          :id="`jsf-${key}`"
          class="json-schema-form__control"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :value="getStr(key, properties[key]!)"
          @input="patch(key, ($event.target as HTMLInputElement).value)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.json-schema-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.json-schema-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.json-schema-form__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--island-text);
}

.json-schema-form__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--island-text-muted);
}

.json-schema-form__control {
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: rgba(128, 128, 128, 0.06);
  color: var(--island-text);
  font-size: 14px;
}

.json-schema-form__select {
  cursor: pointer;
}

.json-schema-form__check-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.json-schema-form__checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--island-primary-color, var(--island-accent));
}
</style>
