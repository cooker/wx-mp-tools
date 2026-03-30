export function createStore(initialTemplates = []) {
  const state = {
    templates: initialTemplates,
    filtered: initialTemplates,
    selectedId: initialTemplates[0]?.id || null,
    currentTab: "DDL",
    search: "",
    bizType: ""
  };

  const listeners = [];

  function notify() {
    listeners.forEach((fn) => fn(getState()));
  }

  function getState() {
    return { ...state };
  }

  function subscribe(listener) {
    listeners.push(listener);
    listener(getState());
  }

  function setTemplates(templates) {
    state.templates = templates;
    state.filtered = templates;
    state.selectedId = templates[0]?.id || null;
    state.currentTab = "DDL";
    notify();
  }

  function selectTemplate(id) {
    state.selectedId = id;
    state.currentTab = "DDL";
    notify();
  }

  function setTab(tab) {
    state.currentTab = tab;
    notify();
  }

  function setSearch(search) {
    state.search = search.trim().toLowerCase();
    applyFilter();
  }

  function setBizType(bizType) {
    state.bizType = bizType;
    applyFilter();
  }

  function applyFilter() {
    state.filtered = state.templates.filter((item) => {
      const hitSearch =
        !state.search ||
        `${item.name} ${item.code}`.toLowerCase().includes(state.search);
      const hitBiz = !state.bizType || item.bizType === state.bizType;
      return hitSearch && hitBiz;
    });

    if (!state.filtered.some((item) => item.id === state.selectedId)) {
      state.selectedId = state.filtered[0]?.id || null;
      state.currentTab = "DDL";
    }
    notify();
  }

  return {
    getState,
    subscribe,
    setTemplates,
    selectTemplate,
    setTab,
    setSearch,
    setBizType
  };
}
