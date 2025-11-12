import { NextRequest, NextResponse } from "next/server";
import { generate3DFromText, generate3DFromImage } from "@/lib/huggingface-api";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 секунд для генерации

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, imageUrl, model } = body;

    if (!prompt && !imageUrl) {
      return NextResponse.json(
        { error: "Требуется промпт или изображение" },
        { status: 400 }
      );
    }

    let result;
    
    if (imageUrl) {
      result = await generate3DFromImage(imageUrl, prompt, model);
    } else {
      result = await generate3DFromText(prompt, model);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.data?.error || "Ошибка генерации" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
