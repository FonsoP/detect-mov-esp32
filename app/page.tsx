"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Photo {
  name: string;
  url: string;
  time: number;
  date: string;
}

interface Subscriber {
  id: string;
  name: string;
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [settings, setSettings] = useState({ delay: 1500 });
  const [newSubId, setNewSubId] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [photosRes, subRes, settingsRes] = await Promise.all([
        fetch("/api/photos"),
        fetch("/api/subscribers"),
        fetch("/api/settings"),
      ]);
      const photosData = await photosRes.json();
      const subData = await subRes.json();
      const settingsData = await settingsRes.json();
      setPhotos(photosData);
      setSubscribers(subData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubId) return;
    await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", id: newSubId, name: newSubName }),
    });
    setNewSubId("");
    setNewSubName("");
    fetchData();
  };

  const handleRemoveSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id }),
    });
    fetchData();
  };

  const saveSettings = async () => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    alert("Settings Saved!");
  };

  const latestPhoto = photos[0];
  const historyPhotos = photos.slice(1);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h1 className="text-xl font-bold tracking-tight">Sentinela AI</h1>
          </div>
          <p className="text-sm text-zinc-500">System Active</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* LATEST PHOTO SECTION */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            📸 Latest Capture
          </h2>
          {latestPhoto ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-black">
              <Image
                src={latestPhoto.url}
                alt="Latest Intruder"
                fill
                className="object-contain"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <p className="font-mono text-lg">{latestPhoto.date}</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
              {loading ? "Loading camera feed..." : "No detections yet"}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* HISTORY SECTION */}
          <section className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-zinc-700 dark:text-zinc-300">History</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {historyPhotos.map((photo) => (
                <div key={photo.name} className="group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <p className="absolute bottom-2 left-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1 rounded">
                    {new Date(photo.time).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {historyPhotos.length === 0 && !loading && (
                <p className="text-zinc-500 text-sm py-4">History is empty.</p>
              )}
            </div>
          </section>

          {/* SUBSCRIPTIONS SECTION */}
          <section className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">📢 Telegram Subscribers</h2>
              <div className="space-y-3 mb-6">
                {subscribers.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">{sub.id}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveSubscriber(sub.id)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {subscribers.length === 0 && <p className="text-sm text-zinc-500">No subscribers active.</p>}
              </div>

              <form onSubmit={handleAddSubscriber} className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Add New User</h3>
                <input
                  type="text"
                  placeholder="Telegram Chat ID"
                  className="w-full text-sm p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newSubId}
                  onChange={(e) => setNewSubId(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Name (Optional)"
                  className="w-full text-sm p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newSubId}
                  className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Subscribe User
                </button>
                <p className="text-xs text-zinc-400 mt-2">
                  * Get Chat ID from @userinfobot on Telegram.
                </p>
              </form>
            </div>

            {/* SETTINGS SECTION */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">⚙️ System Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Sensor Delay (ms)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={settings.delay}
                      onChange={(e) => setSettings({ ...settings, delay: parseInt(e.target.value) })}
                      className="w-full text-sm p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent"
                    />
                    <button
                      onClick={saveSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Time execution loop for motion detection.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
