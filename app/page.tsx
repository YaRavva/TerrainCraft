"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "@/components/header";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Введите описание для генерации");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/3d-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: "SHAP_E_DIRECT" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка генерации");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeroHeader />
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">TerrainCraft</h1>
            <p className="text-lg text-muted-foreground">
              Генерация 3D-объектов и ландшафтов по текстовому описанию
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium mb-2">
              Описание сцены
            </label>
            <textarea
              className="w-full min-h-[120px] p-3 border rounded-md bg-background"
              placeholder="Например: университетский кампус с домами, парками и рекой в осеннем сезоне"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-4 w-full"
              size="lg"
            >
              {loading ? "Генерация..." : "Сгенерировать 3D модель"}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 mb-6">
              <p className="font-medium">Ошибка:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Результат</h2>
              <div className="bg-muted rounded p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Модель: {result.model}
                </p>
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(result.output, null, 2)}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Примечание: 3D viewer будет добавлен в следующей версии
              </p>
            </div>
          )}

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Для работы требуется API ключ Hugging Face в переменной окружения
            </p>
            <p className="mt-1">
              Получите ключ на{" "}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                huggingface.co/settings/tokens
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
