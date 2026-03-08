import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GESTURES, type GestureInfo } from "@/lib/gesture-data";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronRight, Search } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "vowel", label: "Vowels" },
  { value: "consonant", label: "Consonants" },
  { value: "number", label: "Numbers" },
  { value: "word", label: "Words" },
];

export default function LearnPage() {
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<GestureInfo | null>(null);
  const [search, setSearch] = useState("");

  const filtered = GESTURES.filter((g) => {
    const matchCategory = category === "all" || g.category === category;
    const matchSearch = g.label.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="container py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Learn Indian Sign Language
          </h1>
          <p className="text-muted-foreground">
            Browse {GESTURES.length} gesture cards — alphabets, numbers, and common words.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gestures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((gesture, i) => (
            <motion.div
              key={gesture.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.5) }}
            >
              <Card
                className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => setSelected(gesture)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square rounded-lg bg-secondary/30 overflow-hidden mb-3">
                    <img
                      src={gesture.image}
                      alt={`ISL sign for ${gesture.label}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display text-lg font-semibold">{gesture.label}</h3>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {gesture.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                    Learn <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No gestures found</p>
            <p className="text-sm mt-1">Try a different search or category.</p>
          </div>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-xl overflow-hidden bg-secondary/30 flex-shrink-0">
                          <img
                            src={selected.image}
                            alt={`ISL sign for ${selected.label}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <CardTitle className="font-display text-2xl">{selected.label}</CardTitle>
                          <CardDescription>{selected.description}</CardDescription>
                          <Badge variant="secondary" className="mt-1 text-xs capitalize">
                            {selected.category}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      How to perform this sign
                    </h4>
                    <ol className="space-y-3">
                      {selected.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
