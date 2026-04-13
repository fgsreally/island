<script setup lang="ts">
import { computed, ref } from 'vue'
import JsonSchemaForm from '../../../components/JsonSchemaForm.vue'
import {
  getRegisteredPlugins,
  islandShellSettingsDefaults,
  islandShellSettingsSchema,
  loadIslandSettings,
  normalizeIslandShell,
  saveIslandSettings,
  type PluginSettingsMap,
} from '../../../utils/island-settings'
import { showToast } from '../../../utils/toast'

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

hydrateDrafts()

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
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '保存失败'
  }
}
</script>

<template>
  <div class="settings-page">
    <header class="island-settings-head">
      <h2 id="island-settings-title">设置</h2>
   
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
      <button type="button" class="island-settings-btn primary" @click="save">保存</button>
    </footer>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--island-bg);
  color: var(--island-text);
  font-family: system-ui, -apple-system, sans-serif;
}

.island-settings-head {
  padding: 24px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.island-settings-head h2 {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
}

.island-settings-hint {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--island-text-muted);
}

.island-settings-hint code {
  font-size: 13px;
  color: var(--island-primary-color, var(--island-accent));
}

.island-settings-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.island-settings-section {
  margin-bottom: 28px;
}

.island-settings-section h3 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}

.island-settings-schema-id {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--island-text-muted);
}

.island-settings-error {
  margin: 16px 0 0;
  font-size: 14px;
  color: var(--island-error);
}

.island-settings-foot {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

.island-settings-btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.island-settings-btn.primary {
  background: var(--island-primary-color, var(--island-accent));
  color: var(--island-on-accent);
}

.island-settings-btn.primary:hover {
  opacity: 0.9;
}
</style>
