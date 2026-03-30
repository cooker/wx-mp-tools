import { createStore } from "./state.js";
import { loadAllMarkdownTemplates } from "./services/mdLoader.js";
import { parseTemplateMd } from "./services/mdParser.js";
import { initSidebar } from "./ui/sidebar.js";
import { initDetail } from "./ui/detail.js";

async function bootstrap() {
  const store = createStore([]);
  initSidebar(store);
  initDetail(store);

  try {
    const markdowns = await loadAllMarkdownTemplates();
    const templates = markdowns.map((md, idx) => parseTemplateMd(md, idx));
    store.setTemplates(templates);
  } catch (error) {
    const titleEl = document.getElementById("templateTitle");
    const descEl = document.getElementById("templateDesc");
    const contentEl = document.getElementById("content");
    titleEl.textContent = "加载失败";
    descEl.textContent = "无法读取本地模板，请确认以静态服务器方式运行。";
    contentEl.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

bootstrap();
