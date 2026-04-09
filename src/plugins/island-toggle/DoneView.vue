<script setup lang="ts">
import { ref, watch } from 'vue'
import { islandStore } from '../../state/island'

defineProps<{ expanded: boolean }>()

const todos = ref([
  { id: 1, text: '收集素材', done: false },
  { id: 2, text: '分析内容', done: false },
  { id: 3, text: '生成摘要', done: false },
])

function toggle(id: number) {
  const t = todos.value.find(t => t.id === id)
  if (t) t.done = !t.done
}

// 全部勾选后立刻回到 idle
watch(todos, (list) => {
  if (list.every(t => t.done)) {
    todos.value.forEach(t => t.done = false)
    islandStore.state = 'idle'
  }
}, { deep: true })
</script>

<template>
  <!-- 收缩（一般不会出现，done 自动展开） -->
  <div v-if="!expanded" class="island-collapsed-content">
    <div class="island-state-dot done" />
    <span class="island-collapsed-label">解析完成</span>
  </div>

  <!-- 展开：标题行 + Todo -->
  <div v-else class="island-expanded-wrap">
    <div class="island-expanded-title-row">
      <div class="island-state-dot done" />
      <span class="island-collapsed-label">解析完成</span>
    </div>
    <div class="island-expanded-body">
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
    </div>
  </div>
</template>
