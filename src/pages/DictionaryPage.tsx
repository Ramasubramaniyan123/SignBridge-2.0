import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GESTURES, GestureInfo } from "@/lib/gesture-data";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "vowel", label: "Vowels" },
  { key: "consonant", label: "Consonants" },
  { key: "number", label: "Numbers" },
  { key: "word", label: "Words" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [selected, setSelected] = useState<GestureInfo | null>(null);

  const filtered = useMemo(() => {
    return GESTURES.filter((g) => {
      const matchesCategory = category === "all" || g.category === category;
      const matchesSearch =
        !search ||
        g.label.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div className="container py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Gesture Dictionary
          </h1>
          <p className="text-muted-foreground">
            Browse all {GESTURES.length} ISL gestures. Available offline.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gestures..."
              className="w-full bg-secondary/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  category === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Gesture Grid */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((g) => (
                  <motion.button
                    key={g.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelected(g)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-md",
                      selected?.id === g.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <img
                      src={g.image}
                      alt={g.label}
                      className="h-12 w-12 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span className="text-xs font-semibold text-foreground">{g.label}</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      {g.category}
                    </Badge>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No gestures match your search.</p>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="md:col-span-1">
            <div className="sticky top-20">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <img
                            src={selected.image}
                            alt={selected.label}
                            className="h-32 w-32 mx-auto rounded-xl object-cover mb-3"
                          />
                          <h2 className="font-display text-2xl font-bold">{selected.label}</h2>
                          <Badge className="mt-1">{selected.category}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {selected.description}
                        </p>

                        <div>
                          <h3 className="text-sm font-semibold mb-2">How to sign:</h3>
                          <ol className="space-y-2">
                            {selected.instructions.map((step, i) => (
                              <li key={i} className="flex gap-2 text-sm">
                                <span className="shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                                  {i + 1}
                                </span>
                                <span className="text-muted-foreground">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card>
                      <CardContent className="p-6 text-center py-12 text-muted-foreground">
                        <p className="text-sm">Select a gesture to see details</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
