function getBizTypes(templates) {
  return [...new Set(templates.map((item) => item.bizType).filter(Boolean))];
}

export function initSidebar(store) {
  const listEl = document.getElementById("templateList");
  const searchEl = document.getElementById("searchInput");
  const typeEl = document.getElementById("typeSelect");

  searchEl.addEventListener("input", () => {
    store.setSearch(searchEl.value);
  });

  typeEl.addEventListener("change", () => {
    store.setBizType(typeEl.value);
  });

  store.subscribe((state) => {
    const bizTypes = getBizTypes(state.templates);
    const optionsHtml = ['<option value="">全部分类</option>']
      .concat(
        bizTypes.map((biz) => {
          const selected = biz === state.bizType ? "selected" : "";
          return `<option value="${biz}" ${selected}>${biz}</option>`;
        })
      )
      .join("");
    typeEl.innerHTML = optionsHtml;

    if (!state.filtered.length) {
      listEl.innerHTML = '<div class="empty">没有匹配的模板</div>';
      return;
    }

    listEl.innerHTML = state.filtered
      .map((item) => {
        const active = item.id === state.selectedId ? "active" : "";
        return `
          <div class="item ${active}" data-id="${item.id}">
            <div class="name">${item.name}</div>
            <div class="meta">编码: ${item.code} | 分类: ${item.bizType}</div>
          </div>
        `;
      })
      .join("");

    const items = listEl.querySelectorAll(".item");
    items.forEach((el) => {
      el.addEventListener("click", () => {
        store.selectTemplate(el.dataset.id);
      });
    });
  });
}
