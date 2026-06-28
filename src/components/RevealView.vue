<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  players: { type: Array, required: true },
  config: { type: Object, required: true }
})
const emit = defineEmits(['redeal', 'back'])

const active = ref(null) // 当前正在查看的玩家
const holding = ref(false) // 是否正在长按
const revealAll = ref(false) // 公布所有身份

const viewedCount = computed(() => props.players.filter((p) => p.viewed).length)
const allViewed = computed(() => viewedCount.value === props.players.length)

function openPlayer(p) {
  active.value = p
  holding.value = false
}
function closePlayer() {
  active.value = null
  holding.value = false
}

function pressStart(e) {
  if (e && e.cancelable) e.preventDefault()
  holding.value = true
  if (active.value) active.value.viewed = true
}
function pressEnd() {
  holding.value = false
}

function onRedeal() {
  if (!confirm('重新随机分配身份？所有人需要重新查看。')) return
  closePlayer()
  revealAll.value = false
  emit('redeal')
}
function onBack() {
  emit('back')
}
</script>

<template>
  <div>
    <header class="head">
      <button class="ghost" @click="onBack">‹ 设置</button>
      <div class="title">
        <h1>看身份</h1>
        <span class="progress">已查看 {{ viewedCount }} / {{ players.length }}</span>
      </div>
      <button class="ghost" @click="onRedeal">重发</button>
    </header>

    <p class="tip">
      拿着手机依次传给每位玩家，点开自己的名字，<b>长按</b>查看词语。
    </p>

    <div class="grid">
      <button
        v-for="p in players"
        :key="p.id"
        class="pcard"
        :class="{ done: p.viewed }"
        @click="openPlayer(p)"
      >
        <span class="pname">{{ p.name }}</span>
        <span class="pstatus">
          <template v-if="p.viewed">✓ 已查看</template>
          <template v-else>点击查看</template>
        </span>
      </button>
    </div>

    <div class="footer">
      <button v-if="allViewed && !revealAll" class="reveal-all" @click="revealAll = true">
        游戏结束 · 公布所有身份
      </button>

      <Transition name="fade">
        <div v-if="revealAll" class="answers">
          <div class="answers-head">
            <span>身份公布</span>
            <button class="ghost" @click="revealAll = false">收起</button>
          </div>
          <div class="answers-words">
            <span><b class="civil-t">平民</b>：{{ config.civilWord }}</span>
            <span><b class="spy-t">卧底</b>：{{ config.spyWord }}</span>
          </div>
          <div class="answer-list">
            <div
              v-for="p in players"
              :key="p.id"
              class="answer-row"
              :class="p.role"
            >
              <span>{{ p.name }}</span>
              <span class="role-tag">{{ p.role === 'spy' ? '卧底' : '平民' }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 单人查看弹层 -->
    <Transition name="pop">
      <div v-if="active" class="overlay" @click.self="closePlayer">
        <div class="sheet no-callout">
          <div class="sheet-name">{{ active.name }}</div>

          <div
            class="hold-area no-callout"
            :class="{ active: holding, [active.role]: holding }"
            @touchstart.prevent="pressStart"
            @touchend.prevent="pressEnd"
            @touchcancel="pressEnd"
            @mousedown.prevent="pressStart"
            @mouseup="pressEnd"
            @mouseleave="pressEnd"
            @contextmenu.prevent
          >
            <template v-if="holding">
              <div class="role-line">
                {{ active.role === 'spy' ? '🕵️ 卧底' : '🙂 平民' }}
              </div>
              <div class="word">{{ active.word }}</div>
              <div class="hold-hint">松开隐藏</div>
            </template>
            <template v-else>
              <div class="lock">👆</div>
              <div class="hold-hint big">长按查看你的词语</div>
            </template>
          </div>

          <button class="done-btn" @click="closePlayer">
            {{ active.viewed ? '我记住了，下一位 →' : '关闭' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.title {
  text-align: center;
}
.title h1 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 2px;
}
.progress {
  font-size: 12px;
  color: var(--muted);
}
.ghost {
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  padding: 8px 6px;
  border-radius: 10px;
}
.ghost:active {
  color: var(--text);
}

.tip {
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 18px;
  line-height: 1.5;
}
.tip b {
  color: var(--primary-2);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.pcard {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  color: var(--text);
  text-align: left;
  transition: transform 0.08s ease, border 0.15s ease;
}
.pcard:active {
  transform: scale(0.97);
}
.pcard.done {
  border-color: var(--ok);
  background: linear-gradient(180deg, rgba(52, 199, 89, 0.12), var(--card));
}
.pname {
  font-size: 18px;
  font-weight: 700;
  word-break: break-all;
}
.pstatus {
  font-size: 13px;
  color: var(--muted);
}
.pcard.done .pstatus {
  color: var(--ok);
}

.footer {
  margin-top: 20px;
}
.reveal-all {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  background: var(--card-2);
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  border: 1px solid var(--line);
}
.reveal-all:active {
  transform: scale(0.98);
}

.answers {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
}
.answers-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  margin-bottom: 10px;
}
.answers-words {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 12px;
}
.civil-t {
  color: var(--civil);
}
.spy-t {
  color: var(--spy);
}
.answer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.answer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-2);
  font-size: 16px;
}
.answer-row .role-tag {
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 999px;
}
.answer-row.civil .role-tag {
  background: rgba(52, 192, 164, 0.18);
  color: var(--civil);
}
.answer-row.spy .role-tag {
  background: rgba(255, 122, 89, 0.18);
  color: var(--spy);
}

/* 弹层 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 7, 18, 0.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 20px);
  z-index: 50;
}
.sheet {
  width: 100%;
  max-width: 420px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 22px;
}
.sheet-name {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hold-area {
  height: 260px;
  border-radius: 20px;
  border: 2px dashed var(--line);
  background: var(--card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.hold-area.active {
  border-style: solid;
}
.hold-area.civil {
  background: radial-gradient(120% 120% at 50% 30%, rgba(52, 192, 164, 0.28), var(--card));
  border-color: var(--civil);
}
.hold-area.spy {
  background: radial-gradient(120% 120% at 50% 30%, rgba(255, 122, 89, 0.28), var(--card));
  border-color: var(--spy);
}
.lock {
  font-size: 40px;
}
.hold-hint {
  color: var(--muted);
  font-size: 14px;
}
.hold-hint.big {
  font-size: 17px;
  font-weight: 600;
}
.role-line {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}
.word {
  font-size: 44px;
  font-weight: 800;
  letter-spacing: 2px;
  word-break: break-all;
  padding: 0 10px;
}

.done-btn {
  width: 100%;
  height: 52px;
  margin-top: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: #fff;
  font-size: 17px;
  font-weight: 700;
}
.done-btn:active {
  transform: scale(0.98);
}
</style>
