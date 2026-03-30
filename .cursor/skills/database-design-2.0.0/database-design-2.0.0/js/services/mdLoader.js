export async function loadManifest(path = "./templates/manifest.json") {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`manifest 读取失败: ${response.status}`);
  }

  const json = await response.json();
  if (!json || !Array.isArray(json.files)) {
    throw new Error("manifest.json 格式错误，缺少 files 数组");
  }

  return json.files;
}

export async function loadAllMarkdownTemplates() {
  const files = await loadManifest();
  const requests = files.map(async (file) => {
    const path = `./templates/${file}`;
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`模板读取失败: ${path}`);
    }
    return response.text();
  });

  return Promise.all(requests);
}
