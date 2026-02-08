"use client";

import { useState } from "react";

export default function GeodeApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Normalize API response
  const normalizeGeodeResponse = (raw: any) => {
    if (!raw) return null;
    return {
      analysis: {
        primary_topic: raw.analysis?.primary_topic ?? "Unknown",
        target_audience: raw.analysis?.target_audience ?? "Unknown",
        ambiguities: Array.isArray(raw.analysis?.ambiguities)
          ? raw.analysis.ambiguities
          : [],
      },
      diffs: Array.isArray(raw.diffs) ? raw.diffs : [],
    };
  };

  const runGeode = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a valid URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/run-geode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const json = await res.json();
      const normalized = normalizeGeodeResponse(json);
      setData(normalized);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while running Geode.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start p-8 bg-gray-50">
      <div className="w-full max-w-3xl bg-white p-6 rounded shadow space-y-6">
        <h1 className="text-3xl font-semibold">Geode</h1>
        <p>Optimize your site for AI search.</p>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            onClick={runGeode}
            disabled={loading || !url.trim()}
          >
            {loading ? "Loading..." : "Run"}
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {data && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-medium">How AI search sees your site</h2>
              <p><strong>Primary topic:</strong> {data.analysis.primary_topic}</p>
              <p><strong>Audience:</strong> {data.analysis.target_audience}</p>
              <ul>
                {data.analysis.ambiguities.map((a: string, i: number) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium">What Geode changed</h2>
              {data.diffs.length === 0 && <p>No changes detected.</p>}
              {data.diffs.map((diff: string, i: number) => (
                <pre
                  key={i}
                  className="bg-gray-900 text-white p-2 rounded overflow-x-auto"
                >
                  {diff}
                </pre>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
