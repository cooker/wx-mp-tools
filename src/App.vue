<script setup>
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import {
  NConfigProvider,
  NDialogProvider,
  NNotificationProvider,
  NMessageProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NButton,
  NSpace,
  NText,
  darkTheme,
} from 'naive-ui'
import { navConfig } from './config/nav.config.js'
import { promptConfig } from './config/prompt.config.js'
import { sqlConfig } from './config/sql.config.js'
import { naiveThemeOverrides } from './theme/naiveTheme.js'

const route = useRoute()
const { site } = navConfig

const showPromptsLink = computed(() => Boolean(promptConfig?.enabled))
const showSqlLink = computed(() => Boolean(sqlConfig?.enabled))
const showCommonSoftLink = computed(() => Boolean(navConfig?.categories?.some((c) => c.id === 'common-soft')))
const showHeaderNav = computed(() => showPromptsLink.value || showSqlLink.value || showCommonSoftLink.value)

const isHome = computed(() => route.name === 'home')
const isPrompts = computed(() => route.name === 'prompts')
const isSql = computed(() => route.name === 'sql')
const isCommonSoft = computed(() => route.name === 'common-soft')

const sqlNavLabel = computed(() => sqlConfig?.navLabel || 'SQL 模板')
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="naiveThemeOverrides">
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <n-layout class="app-layout" embedded>
            <n-layout-header bordered class="header">
              <div class="header__inner">
                <h1 class="header__title">
                  <router-link to="/" class="header__title-link">{{ site.title }}</router-link>
                </h1>
                <n-space v-if="showHeaderNav" size="small" aria-label="主导航">
                  <router-link to="/" class="header__nav-link">
                    <n-button size="small" :type="isHome ? 'primary' : 'default'" quaternary>
                      工具
                    </n-button>
                  </router-link>
                  <router-link v-if="showPromptsLink" to="/prompts" class="header__nav-link">
                    <n-button size="small" :type="isPrompts ? 'primary' : 'default'" quaternary>
                      提示词
                    </n-button>
                  </router-link>
                  <router-link v-if="showSqlLink" to="/sql" class="header__nav-link">
                    <n-button size="small" :type="isSql ? 'primary' : 'default'" quaternary>
                      {{ sqlNavLabel }}
                    </n-button>
                  </router-link>
                  <router-link v-if="showCommonSoftLink" to="/common-soft" class="header__nav-link">
                    <n-button size="small" :type="isCommonSoft ? 'primary' : 'default'" quaternary>
                      常用软件
                    </n-button>
                  </router-link>
                </n-space>
              </div>
              <n-text v-if="isHome && site.description" depth="3" class="header__desc">
                {{ site.description }}
              </n-text>
            </n-layout-header>

            <n-layout-content class="main">
              <RouterView v-slot="{ Component }">
                <component :is="Component" />
              </RouterView>
            </n-layout-content>

            <n-layout-footer bordered class="footer">
              <p>编辑 <code>src/config/nav.config.js</code>、<code>src/config/prompt.config.js</code> 快速配置</p>
              <p class="footer__links">
                <a href="./site-privacy.html" target="_blank" rel="noopener">隐私协议</a>
                <span class="footer__sep" aria-hidden="true">·</span>
                <a href="./terms.html" target="_blank" rel="noopener">服务条款</a>
              </p>
            </n-layout-footer>
          </n-layout>
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style scoped>
.app-layout {
  background: transparent;
}

.header {
  margin-bottom: 1rem;
  background: transparent;
  padding: 0.75rem 0 1rem;
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header__title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--text);
}

.header__title-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition);
}
.header__title-link:hover {
  color: var(--accent);
}

.header__nav {
  display: flex;
  gap: 0.25rem;
}

.header__nav-link {
  text-decoration: none;
}

.header__desc {
  font-size: 1rem;
  color: var(--text-muted);
  max-width: 36ch;
  line-height: 1.6;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.main {
  min-height: 40vh;
  padding-top: 0.5rem;
}

.footer {
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  background: transparent;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.footer__links {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.footer__links a {
  color: var(--text-muted);
  transition: color var(--transition);
}
.footer__links a:hover {
  color: var(--accent);
}

.footer__sep {
  color: var(--text-muted);
  opacity: 0.7;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .header {
    animation: none;
  }
}
</style>
