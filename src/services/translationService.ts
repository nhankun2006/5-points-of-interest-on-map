export interface TranslationResponse {
  responseData: {
    translatedText: string;
  };
}

/**
 * Fetches a translation from English to Vietnamese using the MyMemory API.
 * @param text The English text to translate.
 * @returns The translated Vietnamese text, or an error message if it fails.
 */
export const fetchTranslation = async (text: string): Promise<string> => {
  if (!text.trim()) {
    return "";
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text,
  )}&langpair=en|vi`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Translation API request failed");
    }
    const data: TranslationResponse = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error("Failed to fetch translation:", error);
    return "Dịch thất bại. Vui lòng thử lại.";
  }
};
