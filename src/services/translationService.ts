/**
 * Client-side translation service.
 * This calls the backend FastAPI endpoint.
 * The backend URL can be configured via setApiUrl (persisted in localStorage).
 * Default fallback is http://localhost:8000.
 */

export const getApiUrl = () => {
  return localStorage.getItem("huggingface_api_url") || "http://localhost:8000";
};

export const setApiUrl = (url: string) => {
  localStorage.setItem("huggingface_api_url", url);
};

export const fetchTranslation = async (text: string): Promise<string> => {
  if (!text.trim()) return "";

  const baseUrl = getApiUrl().replace(/\/$/, ""); // Remove trailing slash if present
  const endpoint = `${baseUrl}/api/translate`;

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!resp.ok) {
      // Try to read error message for debugging
      const textErr = await resp.text().catch(() => null);
      console.error("Translation backend error:", resp.status, textErr);
      return "Dịch thất bại. Vui lòng kiểm tra kết nối server.";
    }

    const data = await resp.json();
    return data.translated_text || "";
  } catch (error) {
    console.error("Failed to fetch translation from backend:", error);
    return "Dịch thất bại. Vui lòng kiểm tra URL backend.";
  }
};
