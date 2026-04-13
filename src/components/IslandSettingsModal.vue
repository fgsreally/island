<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import JsonSchemaForm from './JsonSchemaForm.vue'
import {
  getRegisteredPlugins,
  islandShellSettingsDefaults,
  islandShellSettingsSchema,
  loadIslandSettings,
  normalizeIslandShell,
  saveIslandSettings,
  type PluginSettingsMap,
} from '../utils/island-settings'
import { showToast } from '../utils/toast'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const plugins = computed(() => getRegisteredPlugins())

const errorText = ref('')
const shellDraft = ref<Record<string, unknown>>({})
const pluginDrafts = ref<Record<string, Record<string, unknown>>>({})

function hydrateDrafts() {
  const stored = loadIslandSettings()
  shellDraft.value = {
    ...islandShellSettingsDefaults,
    ...stored.shell,
  } as Record<string, unknown>
  const next: Record<string, Record<string, unknown>> = {}
  for (const p of plugins.value) {
    next[p.id] = {
      ...(p.defaults as Record<string, unknown>),
      ...((stored.plugins[p.id] ?? {}) as Record<string, unknown>),
    }
  }
  pluginDrafts.value = next
}

function onShellUpdate(v: Record<string, unknown>) {
  shellDraft.value = v
}

function onPluginUpdate(id: string, v: Record<string, unknown>) {
  pluginDrafts.value = { ...pluginDrafts.value, [id]: v }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      errorText.value = ''
      hydrateDrafts()
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  errorText.value = ''
  try {
    const out: PluginSettingsMap = {}
    for (const p of plugins.value) {
      const d = pluginDrafts.value[p.id]
      if (!d) continue
      out[p.id] = d as Record<string, unknown>
    }
    saveIslandSettings({
      shell: normalizeIslandShell(shellDraft.value),
      plugins: out,
    })
    showToast('保存成功')
    close()
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '保存失败'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="modelValue"
      class="island-settings-backdrop"
      role="presentation"
      @click.self="close"
    >
      <div
        class="island-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="island-settings-title"
        @keydown.escape.prevent="close"
      >
        <header class="island-settings-head">
          <h2 id="island-settings-title">设置</h2>
          <p class="island-settings-hint">
            表单由 JSON Schema 生成。各插件在
            <code>plugins/&lt;id&gt;/config.ts</code> 导出 <code>pluginSettings</code>。
          </p>
        </header>

        <div class="island-settings-body">
          <section class="island-settings-section">
            <h3>岛整体</h3>
            <JsonSchemaForm
              :schema="islandShellSettingsSchema"
              :model-value="shellDraft"
              @update:model-value="onShellUpdate"
            />
          </section>

          <section v-for="p in plugins" :key="p.id" class="island-settings-section">
            <h3>{{ p.title }}</h3>
            <p class="island-settings-schema-id">
              <code>{{ p.id }}</code>
            </p>
            <JsonSchemaForm
              :schema="p.schema"
              :model-value="pluginDrafts[p.id] ?? {}"
              @update:model-value="(v) => onPluginUpdate(p.id, v)"
            />
          </section>

          <p v-if="errorText" class="island-settings-error">{{ errorText }}</p>
        </div>

        <footer class="island-settings-foot">
          <button type="button" class="island-settings-btn ghost" @click="close">取消</button>
          <button type="button" class="island-settings-btn primary" @click="save">保存</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
