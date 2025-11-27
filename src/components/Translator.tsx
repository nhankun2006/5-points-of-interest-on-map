import { useState } from "react";
import { fetchTranslation } from "../services/translationService";
import "./Translator.css";

type TranslatorProps = {
  onClose: () => void;
};

function Translator({ onClose }: TranslatorProps) {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    const translation = await fetchTranslation(inputText);
    setTranslatedText(translation);
    setIsLoading(false);
  };

  return (
    <div className="translator-overlay" onClick={onClose}>
      <div className="translator-popup" onClick={(e) => e.stopPropagation()}>
        <div className="translator-header">
          <h2>Dịch Anh - Việt</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="translator-body">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập văn bản tiếng Anh..."
            rows={4}
          />
          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={isLoading}
          >
            {isLoading ? "Đang dịch..." : "Dịch"}
          </button>
          <div className="translation-result">
            <p>{translatedText || "Kết quả dịch sẽ xuất hiện ở đây."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Translator;
