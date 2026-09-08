/**
 * Bright Data Web Unlocker helper — fetches rendered HTML from job platforms.
 */
export function hasBrightDataKey() {
  const key = process.env.BRIGHT_DATA_API_KEY;
  return Boolean(key && !key.startsWith("your_"));
}

export async function fetchPageHtml(targetUrl) {
  if (!hasBrightDataKey()) {
    throw new Error("Bright Data API key is not configured");
  }

  const zone = process.env.BRIGHT_DATA_ZONE || "mcp_unlocker";
  const apiKey = process.env.BRIGHT_DATA_API_KEY;

  const response = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone,
      url: targetUrl,
      format: "raw",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Bright Data request failed (${response.status}): ${body.slice(0, 200)}`
    );
  }

  return response.text();
}
