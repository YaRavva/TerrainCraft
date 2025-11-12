"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ModelType } from "@/lib/huggingface-api";

export default function ThreeDTestPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [model, setModel] = useState<ModelType>("SHAP_E_DIRECT");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const models: { value: ModelType; label: string; type: string }[] = [
    { value: "SHAP_E_DIRECT", label: "Shap-E Direct (OpenAI)", type: "Text-to-3D" },
    { value: "SHAP_E_SPACE", label: "Shap-E Space", type: "Text-to-3D (Space)" },
    { value: "POINT_E_SPACE", label: "Point-E Space", type: "Text-to-3D (Space)" },
    { value: "ZERO123_SPACE", label: "Zero-123 Space", type: "Image-to-3D (Space)" },
    { value: "THREEDY", label: "ThreeDY (Lucataco)", type: "3D Generation (Space)" },
  ];

  const handleGenerate = async () => {
    if (!prompt && !imageUrl) {
      setError("Please provide either a prompt or an image URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/3d-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt || undefined,
          image: imageUrl || undefined,
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">3D Generation Test (Hugging Face)</h1>

      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as ModelType)}
            className="w-full px-4 py-2 border rounded-md bg-background"
            disabled={loading}
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} - {m.type}
              </option>
            ))}
          </select>
        </div>

        {/* Text Prompt */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Text Prompt (for Text-to-3D)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., a red chair, a blue car, a wooden table"
            className="w-full px-4 py-2 border rounded-md bg-background min-h-[100px]"
            disabled={loading}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Image URL (for Image-to-3D, optional)
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border rounded-md bg-background"
            disabled={loading}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || (!prompt && !imageUrl)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate 3D Model"
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-destructive font-medium mb-2">Error:</p>
            <p className="text-sm mb-2">{error}</p>
            {error.includes("404") || error.includes("not found") ? (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-xs">
                <p className="font-medium mb-1">💡 Suggestion:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This model may not have an inference endpoint</li>
                  <li>Try a different model from the list</li>
                  <li>Check if the model exists on Hugging Face Hub</li>
                  <li>Some models require special setup or are only available through Spaces</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Result:</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Model:</strong> {result.data?.model}
              </p>
              <p className="text-sm">
                <strong>Success:</strong> {result.success ? "Yes" : "No"}
              </p>
              {result.data?.error && (
                <p className="text-sm text-destructive">
                  <strong>Error:</strong> {result.data.error}
                </p>
              )}
              {result.data?.output && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Output:</p>
                  <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-96">
                    {JSON.stringify(result.data.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="font-semibold mb-2">ℹ️ Information</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>
              Hugging Face Inference API has free tier with rate limits
            </li>
            <li>
              For better results, add your API key to{" "}
              <code className="bg-background px-1 rounded">
                HUGGINGFACE_API_KEY
              </code>{" "}
              in .env.local (without NEXT_PUBLIC_ prefix)
            </li>
            <li>
              Get your free API key at:{" "}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                huggingface.co/settings/tokens
              </a>
            </li>
            <li>
              Модели с суффиксом "SPACE" используют Hugging Face Spaces API
            </li>
            <li>
              Если модель не имеет inference endpoint, будет показана ошибка
            </li>
            <li>
              Рекомендуется начать с "SHAP_E_DIRECT" или "THREEDY" для тестирования
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

