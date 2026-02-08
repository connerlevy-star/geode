"use client";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI if key is present
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Fetch page HTML
    let html = "";
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
      html = await res.text();
    } catch (err) {
      console.error("Page fetch failed:", err);
      html = "";
    }

    // Extract plain text from HTML (basic stripping)
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000); // limit length for AI

    // If no OpenAI key, return mock
    if (!openai) {
      return NextResponse.json({
        analysis: {
          primary_topic: "Digital Marketing",
          target_audience: "Startups and SMEs",
          ambiguities: ["SEO", "Content Optimization"],
        },
        diffs: [
          "Added meta description for better AI search visibility",
          "Reworded headings for clarity",
        ],
      });
    }

    // Call OpenAI
    const prompt = `
      Analyze the following website content. Return a JSON object with:
      {
        "analysis": {
          "primary_topic": string,
          "target_audience": string,
          "ambiguities": [string]
        },
        "diffs": [string]
      }
      Content:
      ${textContent}
    `;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const textResponse = aiRes.choices[0]?.message?.content;

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(textResponse || "{}");
    } catch {
      jsonResponse = {
        analysis: { primary_topic: "Unknown", target_audience: "Unknown", ambiguities: [] },
        diffs: ["Could not parse AI response"],
      };
    }

    return NextResponse.json(jsonResponse);

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
