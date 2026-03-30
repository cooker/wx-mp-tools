const TAB_ORDER = ["DDL", "SEED", "QUERY", "UPDATE", "REPORT"];
const TAB_LABEL = {
  DDL: "建表 SQL",
  SEED: "初始化 SQL",
  QUERY: "查询 SQL",
  UPDATE: "更新 SQL",
  REPORT: "统计 SQL"
};

function escapeHtml(content) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function templateFromState(state) {
  return state.templates.find((item) => item.id === state.selectedId) || null;
}

export function initDetail(store) {
  const titleEl = document.getElementById("templateTitle");
  const descEl = document.getElementById("templateDesc");
  const tabsEl = document.getElementById("tabs");
  const contentEl = document.getElementById("content");

  store.subscribe((state) => {
    const current = templateFromState(state);
    if (!current) {
      titleEl.textContent = "请选择左侧模板";
      descEl.textContent = "可展示建表 SQL、查询 SQL、更新 SQL、统计 SQL 等。";
      tabsEl.innerHTML = "";
      contentEl.innerHTML = '<div class="empty">先选择一个业务模板</div>';
      return;
    }

    titleEl.textContent = `${current.name} (${current.code})`;
    descEl.textContent = current.desc || "";

    const tabs = TAB_ORDER.filter((key) => Array.isArray(current.sections[key]));
    tabsEl.innerHTML = tabs
      .map((tab) => {
        const active = tab === state.currentTab ? "active" : "";
        return `<div class="tab ${active}" data-tab="${tab}">${TAB_LABEL[tab]}</div>`;
      })
      .join("");

    tabsEl.querySelectorAll(".tab").forEach((tabEl) => {
      tabEl.addEventListener("click", () => {
        store.setTab(tabEl.dataset.tab);
      });
    });

    const rows = current.sections[state.currentTab] || [];
    if (!rows.length) {
      contentEl.innerHTML = '<div class="empty">当前分类暂无 SQL</div>';
      return;
    }

    contentEl.innerHTML = rows
      .map((row, idx) => {
        return `
          <div class="sql-card">
            <div class="sql-head">
              <div>
                <div class="sql-title">${row.title}</div>
                <div class="sql-note">${row.note || ""}</div>
              </div>
              <button class="btn" data-copy-index="${idx}">复制 SQL</button>
            </div>
            <pre>${escapeHtml(row.sql)}</pre>
          </div>
        `;
      })
      .join("");

    contentEl.querySelectorAll("button[data-copy-index]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const i = Number(btn.dataset.copyIndex);
        const sql = rows[i].sql;
        try {
          await navigator.clipboard.writeText(sql);
          btn.classList.add("ok");
          btn.textContent = "已复制";
          setTimeout(() => {
            btn.classList.remove("ok");
            btn.textContent = "复制 SQL";
          }, 1200);
        } catch (err) {
          window.alert("复制失败，请手动复制");
        }
      });
    });
  });
}
