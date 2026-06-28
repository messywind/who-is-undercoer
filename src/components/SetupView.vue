<script setup>
import { ref, computed, watch } from 'vue'
import wordBank from '../wordBank.json'

const props = defineProps({
  initial: { type: Object, default: null }
})
const emit = defineEmits(['start'])

const STORE_KEY = 'sswd-setup'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return null
}

const saved = props.initial || loadSaved()

const total = ref(saved?.total ?? 4)
const spyCount = ref(saved?.spyCount ?? 1)
const civilWord = ref(saved?.civilWord ?? '')
const spyWord = ref(saved?.spyWord ?? '')
const names = ref(
  saved?.names?.length
    ? saved.names.slice()
    : Array.from({ length: 4 }, (_, i) => `玩家${i + 1}`)
)

// 让名字列表长度始终和总人数一致
watch(total, (n) => {
  n = clampInt(n, 3, 30)
  const cur = names.value
  if (n > cur.length) {
    for (let i = cur.length; i < n; i++) cur.push(`玩家${i + 1}`)
  } else if (n < cur.length) {
    cur.splice(n)
  }
  // 卧底人数不能超过 总人数 - 1
  if (spyCount.value > n - 1) spyCount.value = n - 1
})

function clampInt(v, min, max) {
  v = Math.round(Number(v) || 0)
  return Math.min(max, Math.max(min, v))
}

function stepTotal(d) {
  total.value = clampInt(total.value + d, 3, 30)
}
function stepSpy(d) {
  spyCount.value = clampInt(spyCount.value + d, 1, Math.max(1, total.value - 1))
}

const error = ref('')

// 词库选择
const showBank = ref(false)

function applyPair(pair, swap = false) {
  if (swap && Math.random() < 0.5) {
    civilWord.value = pair.spy
    spyWord.value = pair.civil
  } else {
    civilWord.value = pair.civil
    spyWord.value = pair.spy
  }
  error.value = ''
}

// 从词库里随机抽一组，并随机决定谁是平民/卧底
function randomPair() {
  const groups = wordBank.groups
  const g = groups[Math.floor(Math.random() * groups.length)]
  const p = g.pairs[Math.floor(Math.random() * g.pairs.length)]
  applyPair(p, true)
}

function chooseFromBank(pair) {
  applyPair(pair, false)
  showBank.value = false
}

const canStart = computed(() => {
  return (
    civilWord.value.trim() &&
    spyWord.value.trim() &&
    spyCount.value >= 1 &&
    spyCount.value <= total.value - 1
  )
})

function onStart() {
  if (!civilWord.value.trim() || !spyWord.value.trim()) {
    error.value = '请填写平民词汇和卧底词汇'
    return
  }
  if (spyCount.value < 1 || spyCount.value > total.value - 1) {
    error.value = '卧底人数需在 1 ~ 总人数-1 之间'
    return
  }
  error.value = ''
  const cfg = {
    total: total.value,
    spyCount: spyCount.value,
    civilWord: civilWord.value.trim(),
    spyWord: spyWord.value.trim(),
    names: names.value.map((n, i) => (n.trim() ? n.trim() : `玩家${i + 1}`))
  }
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cfg))
  } catch (e) {}
  emit('start', cfg)
}
</script>

<template>
  <div>
    <header class="head">
      <div class="logo">盒</div>
      <h1>黑盒鲁A分盒的<br />谁是卧底环节</h1>
      <p class="sub">本地传手机版 · 自定义词汇</p>
    </header>

    <section class="card">
      <div class="row">
        <label>总人数</label>
        <div class="stepper">
          <button class="step" @click="stepTotal(-1)" aria-label="减少">−</button>
          <span class="num">{{ total }}</span>
          <button class="step" @click="stepTotal(1)" aria-label="增加">+</button>
        </div>
      </div>
      <div class="divider"></div>
      <div class="row">
        <label>卧底人数</label>
        <div class="stepper">
          <button class="step" @click="stepSpy(-1)" aria-label="减少">−</button>
          <span class="num spy">{{ spyCount }}</span>
          <button class="step" @click="stepSpy(1)" aria-label="增加">+</button>
        </div>
      </div>
      <p class="hint">
        平民 {{ total - spyCount }} 人 · 卧底 {{ spyCount }} 人
      </p>
    </section>

    <section class="card">
      <div class="words-head">
        <h2>词汇</h2>
        <div class="word-actions">
          <button class="mini" @click="randomPair">🎲 随机</button>
          <button class="mini accent" @click="showBank = true">📚 词库</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label"><span class="dot civil"></span>平民词汇</label>
        <input
          v-model="civilWord"
          type="text"
          placeholder="例如：苹果"
          autocomplete="off"
          autocapitalize="off"
        />
      </div>
      <div class="field">
        <label class="field-label"><span class="dot spy"></span>卧底词汇</label>
        <input
          v-model="spyWord"
          type="text"
          placeholder="例如：梨"
          autocomplete="off"
          autocapitalize="off"
        />
      </div>
    </section>

    <section class="card">
      <div class="players-head">
        <h2>玩家 ID</h2>
        <span class="count">{{ total }} 人</span>
      </div>
      <div class="player-list">
        <div v-for="(n, i) in names" :key="i" class="player-input">
          <span class="idx">{{ i + 1 }}</span>
          <input
            v-model="names[i]"
            type="text"
            :placeholder="`玩家${i + 1}`"
            autocomplete="off"
          />
        </div>
      </div>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <button class="primary-btn" :disabled="!canStart" @click="onStart">
      开始分配身份 →
    </button>

    <!-- 词库选择弹层 -->
    <Transition name="fade">
      <div v-if="showBank" class="overlay" @click.self="showBank = false">
        <div class="bank-sheet">
          <div class="bank-head">
            <h3>选择词库</h3>
            <button class="ghost" @click="showBank = false">关闭</button>
          </div>
          <div class="bank-body">
            <div v-for="g in wordBank.groups" :key="g.name" class="bank-group">
              <div class="group-title">
                <span class="g-emoji">{{ g.emoji }}</span>{{ g.name }}
              </div>
              <button
                v-for="(p, i) in g.pairs"
                :key="i"
                class="pair-row"
                @click="chooseFromBank(p)"
              >
                <span class="pair-civil">{{ p.civil }}</span>
                <span class="pair-vs">vs</span>
                <span class="pair-spy">{{ p.spy }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.head {
  text-align: center;
  margin: 10px 0 18px;
}
.logo {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: #fff;
  font-size: 34px;
  font-weight: 800;
  line-height: 60px;
  text-align: center;
  box-shadow: 0 8px 22px rgba(255, 122, 24, 0.4);
}
h1 {
  margin: 12px 0 4px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.32;
  letter-spacing: 1px;
}
.sub {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 14px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.row label {
  font-size: 17px;
  font-weight: 600;
}
.divider {
  height: 1px;
  background: var(--line);
  margin: 14px 0;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}
.step {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--card-2);
  color: var(--text);
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.08s ease, background 0.15s ease;
}
.step:active {
  transform: scale(0.9);
  background: var(--primary);
}
.num {
  min-width: 46px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.num.spy {
  color: var(--spy);
}
.hint {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.words-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.words-head h2 {
  margin: 0;
  font-size: 17px;
}
.word-actions {
  display: flex;
  gap: 8px;
}
.mini {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--card-2);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--line);
  transition: transform 0.08s ease;
}
.mini:active {
  transform: scale(0.94);
}
.mini.accent {
  background: rgba(108, 92, 255, 0.18);
  border-color: var(--primary);
  color: var(--primary-2);
}

.field {
  margin-bottom: 14px;
}
.field:last-child {
  margin-bottom: 0;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 8px;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.dot.civil {
  background: var(--civil);
}
.dot.spy {
  background: var(--spy);
}

input {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--bg-2);
  color: var(--text);
  font-size: 17px;
  padding: 0 14px;
  transition: border 0.15s ease;
}
input:focus {
  border-color: var(--primary);
}

.players-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.players-head h2 {
  margin: 0;
  font-size: 17px;
}
.count {
  color: var(--muted);
  font-size: 13px;
}
.player-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.player-input {
  display: flex;
  align-items: center;
  gap: 10px;
}
.idx {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--card-2);
  color: var(--muted);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.player-input input {
  height: 44px;
  font-size: 16px;
}

.error {
  color: var(--danger);
  text-align: center;
  font-size: 14px;
  margin: 0 0 12px;
}

.primary-btn {
  width: 100%;
  height: 54px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 8px 24px rgba(108, 92, 255, 0.35);
  transition: transform 0.08s ease, opacity 0.15s ease;
}
.primary-btn:active {
  transform: scale(0.98);
}
.primary-btn:disabled {
  opacity: 0.4;
  box-shadow: none;
}

/* 词库弹层 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 7, 18, 0.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 60;
}
.bank-sheet {
  width: 100%;
  max-width: 560px;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 26px 26px 0 0;
  padding: 18px 16px calc(var(--safe-bottom) + 16px);
}
.bank-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.bank-head h3 {
  margin: 0;
  font-size: 19px;
}
.ghost {
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  padding: 6px 4px;
}
.ghost:active {
  color: var(--text);
}
.bank-body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.bank-group {
  margin-bottom: 16px;
}
.group-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  margin: 4px 2px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.g-emoji {
  font-size: 16px;
}
.pair-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 14px;
  margin-bottom: 8px;
  color: var(--text);
  text-align: left;
  transition: transform 0.08s ease, border 0.15s ease;
}
.pair-row:active {
  transform: scale(0.98);
  border-color: var(--primary);
}
.pair-civil {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--civil);
  word-break: break-all;
}
.pair-spy {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--spy);
  text-align: right;
  word-break: break-all;
}
.pair-vs {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--muted);
}
</style>
