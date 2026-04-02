<script setup>
import { NButton, NCard } from 'naive-ui'

defineProps({
  name: { type: String, required: true },
  url: { type: String, required: true },
  desc: { type: String, default: '' },
  icon: { type: String, default: '' },
  usingFallback: { type: Boolean, default: false },
  favorited: { type: Boolean, default: false },
  /** 站内链接：使用 router-link，不新开标签 */
  internal: { type: Boolean, default: false },
})
defineEmits(['toggle-favorite'])
</script>

<template>
  <n-card class="tool-card" size="small" embedded>
    <span
      v-if="usingFallback && !internal"
      class="tool-card__fallback-badge"
      title="当前使用备用地址"
      aria-label="当前使用备用地址"
    >
      备用
    </span>
    <n-button
      v-if="!internal"
      class="tool-card__star"
      text
      :aria-label="favorited ? '取消收藏' : '收藏'"
      @click.stop="$emit('toggle-favorite')"
    >
      <svg v-if="favorited" class="tool-card__star-icon tool-card__star-icon--filled" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <svg v-else class="tool-card__star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </n-button>
    <component
      :is="internal ? 'router-link' : 'a'"
      :to="internal ? url : undefined"
      :href="internal ? undefined : url"
      :target="internal ? undefined : '_blank'"
      :rel="internal ? undefined : 'noopener noreferrer'"
      class="tool-card__link"
    >
      <span v-if="icon" class="tool-card__icon" aria-hidden="true">{{ icon }}</span>
      <div class="tool-card__body">
        <span class="tool-card__name">{{ name }}</span>
        <span v-if="desc" class="tool-card__desc">{{ desc }}</span>
      </div>
      <span class="tool-card__arrow" aria-hidden="true">→</span>
    </component>
  </n-card>
</template>

<style scoped>
.tool-card {
  position: relative;
  transition: border-color var(--transition), background var(--transition);
}

.tool-card__fallback-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 1;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  line-height: 1.2;
  color: #7a4b00;
  background: #fff4d6;
  border: 1px solid #ffd27a;
}
.tool-card:hover {
  background: var(--bg-elevated);
}

.tool-card__star {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  margin: -8px -8px 0 0;
  color: var(--text-muted);
  border-radius: 50%;
  transition: color var(--transition), transform var(--transition);
}
.tool-card__star:hover {
  color: var(--accent);
}
.tool-card__star:active {
  transform: scale(0.95);
}

.tool-card__star-icon {
  width: 20px;
  height: 20px;
}
.tool-card__star-icon--filled {
  color: var(--accent);
}

.tool-card__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  min-height: 44px;
  border-radius: var(--radius-lg);
  text-align: left;
  cursor: pointer;
}

.tool-card__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1;
}

.tool-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.tool-card__name {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text);
}

.tool-card__desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.tool-card__arrow {
  font-size: 1rem;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity var(--transition), transform var(--transition);
  flex-shrink: 0;
}

.tool-card__link:hover .tool-card__arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 移动端三列：竖向紧凑卡片，隐藏描述与箭头，保证可点区域 */
@media (max-width: 768px) {
  .tool-card__link {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0.45rem 0.3rem 0.5rem;
    gap: 0.3rem;
    min-height: 0;
    text-align: center;
  }

  .tool-card__icon {
    font-size: 1.05rem;
  }

  .tool-card__body {
    align-items: center;
    width: 100%;
  }

  .tool-card__name {
    font-size: 0.72rem;
    line-height: 1.25;
    text-align: center;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    word-break: break-word;
  }

  .tool-card__desc {
    display: none;
  }

  .tool-card__arrow {
    display: none;
  }

  .tool-card__star {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    top: 0.15rem;
    right: 0.15rem;
    margin: -6px -6px 0 0;
  }

  .tool-card__star-icon {
    width: 17px;
    height: 17px;
  }

  .tool-card__fallback-badge {
    font-size: 0.58rem;
    padding: 0.06rem 0.28rem;
    top: 0.2rem;
    left: 0.2rem;
    max-width: calc(100% - 3rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 380px) {
  .tool-card__link {
    padding: 0.4rem 0.2rem 0.45rem;
  }

  .tool-card__name {
    font-size: 0.68rem;
  }

  .tool-card__icon {
    font-size: 0.95rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tool-card__star:active {
    transform: none;
  }
}
</style>
