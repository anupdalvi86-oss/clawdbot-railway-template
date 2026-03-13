export default function (api) {
  const BASE = "https://openclawbrowser-production.up.railway.app";

  async function post(path, payload) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {})
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data;
  }

  function textResult(text) {
    return {
      content: [
        {
          type: "text",
          text
        }
      ]
    };
  }

  function unique(array) {
    return [...new Set(array.filter(Boolean))];
  }

  function extractEmails(text) {
    const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    return unique(matches);
  }

  function extractUrls(text) {
    const matches = text.match(/https?:\/\/[^\s)"'>]+/gi) || [];
    return unique(matches);
  }

  api.registerTool({
    name: "browse_title",
    description: "Open a webpage and return its title",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL to open" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/title", { url: params.url });
      return textResult(
        `Title: ${data.title}\nURL: ${data.url}\nSession: ${data.sessionId ?? "none"}`
      );
    }
  });

  api.registerTool({
    name: "browse_extract",
    description: "Extract readable text from a webpage",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL to open" },
        selector: { type: "string", description: "Optional CSS selector" },
        maxLength: { type: "number", description: "Optional max text length" },
        sessionId: { type: "string", description: "Optional existing browser session id" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/extract", {
        url: params.url,
        selector: params.selector,
        maxLength: params.maxLength,
        sessionId: params.sessionId
      });

      return textResult(
        `Title: ${data.title}\nURL: ${data.url}\nSession: ${data.sessionId ?? "none"}\n\n${data.text}`
      );
    }
  });

  api.registerTool({
    name: "browse_structured_extract",
    description: "Extract page text and return structured information including title, url, emails and links",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        selector: { type: "string" },
        maxLength: { type: "number" },
        sessionId: { type: "string" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/extract", {
        url: params.url,
        selector: params.selector,
        maxLength: params.maxLength,
        sessionId: params.sessionId
      });

      const emails = extractEmails(data.text || "");
      const links = extractUrls(data.text || "");

      const structured = {
        title: data.title,
        url: data.url,
        sessionId: data.sessionId ?? null,
        emails,
        links,
        text: data.text
      };

      return textResult(JSON.stringify(structured, null, 2));
    }
  });

  api.registerTool({
    name: "browse_extract_links",
    description: "Extract URLs/links from a webpage's visible text",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        selector: { type: "string" },
        maxLength: { type: "number" },
        sessionId: { type: "string" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/extract", {
        url: params.url,
        selector: params.selector,
        maxLength: params.maxLength,
        sessionId: params.sessionId
      });

      const links = extractUrls(data.text || "");
      return textResult(
        `Title: ${data.title}\nURL: ${data.url}\nSession: ${data.sessionId ?? "none"}\n\nLinks:\n${links.join("\n") || "No links found in extracted text."}`
      );
    }
  });

  api.registerTool({
    name: "browse_extract_emails",
    description: "Extract email addresses from a webpage's visible text",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        selector: { type: "string" },
        maxLength: { type: "number" },
        sessionId: { type: "string" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/extract", {
        url: params.url,
        selector: params.selector,
        maxLength: params.maxLength,
        sessionId: params.sessionId
      });

      const emails = extractEmails(data.text || "");
      return textResult(
        `Title: ${data.title}\nURL: ${data.url}\nSession: ${data.sessionId ?? "none"}\n\nEmails:\n${emails.join("\n") || "No emails found."}`
      );
    }
  });

  api.registerTool({
    name: "browse_session_start",
    description: "Start a browser session and optionally open a URL",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Optional URL to open immediately" }
      }
    },
    async execute(_id, params) {
      const data = await post("/session/start", {
        url: params?.url
      });

      return textResult(
        `Session started.\nSession: ${data.sessionId}\nTitle: ${data.title}\nURL: ${data.url}`
      );
    }
  });

  api.registerTool({
    name: "browse_session_close",
    description: "Close a browser session",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Existing browser session id" }
      },
      required: ["sessionId"]
    },
    async execute(_id, params) {
      const data = await post("/session/close", {
        sessionId: params.sessionId
      });

      return textResult(`Session close result: ${JSON.stringify(data)}`);
    }
  });

  api.registerTool({
    name: "browse_open",
    description: "Open a URL in an existing session or create a new one",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to open" },
        sessionId: { type: "string", description: "Optional existing session id" }
      },
      required: ["url"]
    },
    async execute(_id, params) {
      const data = await post("/open", {
        url: params.url,
        sessionId: params.sessionId
      });

      return textResult(
        `Opened page.\nSession: ${data.sessionId}\nTitle: ${data.title}\nURL: ${data.url}`
      );
    }
  });

  api.registerTool({
    name: "browse_click",
    description: "Click an element on the current page",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Existing browser session id" },
        selector: { type: "string", description: "CSS selector to click" },
        waitForNavigation: { type: "boolean", description: "Whether to wait for navigation after click" },
        waitForSelector: { type: "string", description: "Optional selector to wait for after click" }
      },
      required: ["sessionId", "selector"]
    },
    async execute(_id, params) {
      const data = await post("/click", {
        sessionId: params.sessionId,
        selector: params.selector,
        waitForNavigation: params.waitForNavigation,
        waitForSelector: params.waitForSelector
      });

      return textResult(
        `Clicked element.\nSession: ${data.sessionId}\nTitle: ${data.title}\nURL: ${data.url}`
      );
    }
  });

  api.registerTool({
    name: "browse_fill_form",
    description: "Fill fields on a form without submitting it",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Existing browser session id" },
        fields: {
          type: "array",
          description: "Array of fields to fill",
          items: {
            type: "object",
            properties: {
              selector: { type: "string" },
              type: { type: "string" },
              value: {},
              checked: { type: "boolean" },
              filePaths: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["selector", "type"]
          }
        }
      },
      required: ["sessionId", "fields"]
    },
    async execute(_id, params) {
      const data = await post("/fill-form", {
        sessionId: params.sessionId,
        fields: params.fields
      });

      return textResult(
        `Filled form.\nSession: ${data.sessionId}\nFilled fields: ${data.filledCount}\nTitle: ${data.title}\nURL: ${data.url}`
      );
    }
  });

  api.registerTool({
    name: "browse_prepare_submit",
    description: "Prepare a form for submission and return preview text, but do not finalize an irreversible action",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Existing browser session id" },
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              selector: { type: "string" },
              type: { type: "string" },
              value: {},
              checked: { type: "boolean" },
              filePaths: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["selector", "type"]
          }
        },
        preSubmitClickSelector: { type: "string" },
        waitForSelector: { type: "string" },
        previewSelector: { type: "string" },
        maxLength: { type: "number" }
      },
      required: ["sessionId"]
    },
    async execute(_id, params) {
      const data = await post("/prepare-submit", {
        sessionId: params.sessionId,
        fields: params.fields,
        preSubmitClickSelector: params.preSubmitClickSelector,
        waitForSelector: params.waitForSelector,
        previewSelector: params.previewSelector,
        maxLength: params.maxLength
      });

      return textResult(
        `Prepared submit.\nSession: ${data.sessionId}\nTitle: ${data.title}\nURL: ${data.url}\nReadyToConfirm: ${data.readyToConfirm}\n\nPreview:\n${data.previewText}`
      );
    }
  });

  api.registerTool({
    name: "browse_confirm_submit",
    description: "Perform the final submit/click for a form or flow. Use only after explicit user confirmation.",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Existing browser session id" },
        selector: { type: "string", description: "CSS selector for the final submit button or confirmation click" },
        waitForNavigation: { type: "boolean", description: "Whether to wait for navigation after click" },
        waitForSelector: { type: "string", description: "Optional selector to wait for after submit" }
      },
      required: ["sessionId", "selector"]
    },
    async execute(_id, params) {
      const data = await post("/click", {
        sessionId: params.sessionId,
        selector: params.selector,
        waitForNavigation: params.waitForNavigation ?? true,
        waitForSelector: params.waitForSelector
      });

      return textResult(
        `Final submit executed.\nSession: ${data.sessionId}\nTitle: ${data.title}\nURL: ${data.url}\nOnly use this after explicit user confirmation.`
      );
    }
  });

  api.registerTool({
    name: "browse_screenshot",
    description: "Take a screenshot of the current page or a URL",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Optional session id" },
        url: { type: "string", description: "Optional URL to open before screenshot" },
        fullPage: { type: "boolean", description: "Whether to capture full page" }
      }
    },
    async execute(_id, params) {
      const res = await fetch(`${BASE}/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: params?.sessionId,
          url: params?.url,
          fullPage: params?.fullPage
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());

      return {
        content: [
          {
            type: "image",
            data: buf.toString("base64"),
            mimeType: "image/png"
          }
        ]
      };
    }
  });
}
