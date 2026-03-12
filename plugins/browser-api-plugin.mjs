export default function (api) {
  const BASE = "https://openclawbrowser-production.up.railway.app";

  async function post(path, payload) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data;
  }

  api.registerTool({
    name: "browse_title",
    description: "Open webpage and return title",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/title", { url: params.url });

      return {
        content: [
          { type: "text", text: `Title: ${data.title}\nURL: ${data.url}` }
        ]
      };
    }
  });

  api.registerTool({
    name: "browse_extract",
    description: "Extract webpage text",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/extract", { url: params.url });

      return {
        content: [{ type: "text", text: data.text }]
      };
    }
  });
}
