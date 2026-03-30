const TAB_KEYS = ["DDL", "SEED", "QUERY", "UPDATE", "REPORT"];

function parseFrontMatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { meta: {}, body: md };
  }

  const meta = {};
  const lines = match[1].split("\n");
  lines.forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  });

  return {
    meta,
    body: md.slice(match[0].length).trim()
  };
}

export function parseTemplateMd(md, index) {
  const { meta, body } = parseFrontMatter(md);
  const sections = {
    DDL: [],
    SEED: [],
    QUERY: [],
    UPDATE: [],
    REPORT: []
  };

  const sectionRegex = /##\s+(DDL|SEED|QUERY|UPDATE|REPORT)\n([\s\S]*?)(?=\n##\s+|$)/g;
  let sectionMatch = null;
  while ((sectionMatch = sectionRegex.exec(body))) {
    const sectionType = sectionMatch[1];
    const sectionBody = sectionMatch[2];
    const itemRegex = /###\s+([^\n]+)(?:\n> NOTE:\s*([^\n]+))?[\s\S]*?```sql\n([\s\S]*?)```/g;
    let itemMatch = null;

    while ((itemMatch = itemRegex.exec(sectionBody))) {
      sections[sectionType].push({
        title: itemMatch[1].trim(),
        note: (itemMatch[2] || "").trim(),
        sql: itemMatch[3].trim()
      });
    }
  }

  const code = meta.code || `template_${index + 1}`;
  return {
    id: code,
    code,
    name: meta.name || `模板 ${index + 1}`,
    bizType: meta.bizType || "未分类",
    desc: meta.description || "",
    version: meta.version || "1.0.0",
    sections: TAB_KEYS.reduce((acc, key) => {
      acc[key] = sections[key] || [];
      return acc;
    }, {})
  };
}
