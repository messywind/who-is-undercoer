<script setup>
import { ref } from 'vue'
import SetupView from './components/SetupView.vue'
import RevealView from './components/RevealView.vue'

const phase = ref('setup') // 'setup' | 'reveal'
const players = ref([])
const config = ref(null)

// 随机洗牌（Fisher–Yates）
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function assignRoles(cfg) {
  const indices = shuffle([...Array(cfg.names.length).keys()])
  const spyset = new Set(indices.slice(0, cfg.spyCount))
  return cfg.names.map((name, i) => {
    const isSpy = spyset.has(i)
    return {
      id: i,
      name: name.trim() || `玩家${i + 1}`,
      role: isSpy ? 'spy' : 'civil',
      word: isSpy ? cfg.spyWord : cfg.civilWord,
      viewed: false
    }
  })
}

function startGame(cfg) {
  config.value = cfg
  players.value = assignRoles(cfg)
  phase.value = 'reveal'
}

// 用同样的名单和词语重新分配身份
function redeal() {
  if (!config.value) return
  players.value = assignRoles(config.value)
}

function backToSetup() {
  phase.value = 'setup'
}
</script>

<template>
  <div class="screen">
    <SetupView
      v-if="phase === 'setup'"
      :initial="config"
      @start="startGame"
    />
    <RevealView
      v-else
      :players="players"
      :config="config"
      @redeal="redeal"
      @back="backToSetup"
    />
  </div>
</template>

<style scoped>
.screen {
  min-height: 100dvh;
  padding: calc(var(--safe-top) + 14px) 16px calc(var(--safe-bottom) + 18px);
  max-width: 560px;
  margin: 0 auto;
}
</style>
