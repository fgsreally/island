<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { definePage } from 'unplugin-vue-router/runtime'
import IslandContent from '../../../components/IslandContent.vue'
import MarqueeText from '../../../components/MarqueeText.vue'
import { useIslandApp } from '../../../app/islandApp'
import { useIslandToggleSettings } from '../composables/useIslandToggleSettings'
import { stripExpanded } from '../../../utils/island-route'

definePage({
  meta: {
    expandType: 'force',
  },
})

const route = useRoute()
const router = useRouter()
const settings = useIslandToggleSettings()
const { setExpanded } = useIslandApp()

const todos = ref([
  { id: 1, text: '收集素材', done: false },
  { id: 2, text: '分析内容', done: false },
  { id: 3, text: '生成摘要', done: false },
])

function toggle(id: number) {
  const t = todos.value.find((x) => x.id === id)
  if (t) t.done = !t.done
}

watch(
  todos,
  (list) => {
    if (list.every((t) => t.done)) {
      todos.value.forEach((t) => {
        t.done = false
      })
      setExpanded(false)
      setTimeout(() => {
        router.replace({
          path: '/island-toggle/idle',
          query: stripExpanded(route.query),
        })
      }, 120)
    }
  },
  { deep: true },
)
</script>

<template>
  <IslandContent collapsed-size="normal" :scroll-when-overflow="true">
    <template #header="{ scrollWhenOverflow }">
      <div class="island-state-dot done" />
      <MarqueeText class="island-collapsed-label" :text="settings.collapsedTitleDone" :enabled="scrollWhenOverflow" />
    </template>

    <div class="island-todo-list">
      <div
        v-for="todo in todos"
        :key="todo.id"
        :class="['island-todo-item', { done: todo.done }]"
        @click="toggle(todo.id)"
      >
        <div class="island-todo-check">{{ todo.done ? '✓' : '' }}</div>
        <span class="island-todo-text">{{ todo.text }}</span>
      </div>
    </div>
  </IslandContent>
</template>

<style scoped>
.island-todo-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.island-todo-item {
  display: flex;
  align-items: center;
  gap: var(--island-plugin-header-gap);
  padding: 7px 10px;
  background: var(--island-todo-row-bg);
  border-radius: var(--island-radius-inner);
  color: var(--island-text);
  font-size: var(--island-font-body);
  cursor: pointer;
  transition: background var(--island-fade);
}
.island-todo-item:hover {
  background: var(--island-todo-row-bg-hover);
}
.island-todo-item.done {
  opacity: 0.45;
  text-decoration: line-through;
}

.island-todo-check {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--island-text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--island-font-tiny);
  color: var(--island-on-badge);
  transition: border-color var(--island-fade), background var(--island-fade);
}
.island-todo-item.done .island-todo-check {
  background: var(--island-success);
  border-color: var(--island-success);
}
.island-todo-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
