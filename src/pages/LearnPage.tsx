import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GESTURES, type GestureInfo } from "@/lib/gesture-data";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "vowel", label: "Vowels" },
  { value: "word", label: "Words" },
];

export default function LearnPage() {
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<GestureInfo | null>(null);

  const filtered =
    category === "all" ? GESTURES : GESTURES.filter((g) => g.category === category);

  return (
    <div className="container py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Learn Indian Sign Language
          </h1>
          <p className="text-muted-foreground">
            Browse gesture cards and learn how to perform each sign.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8">
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

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((gesture, i) => (
            <motion.div
              key={gesture.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card
                className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => setSelected(gesture)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{gesture.emoji}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {gesture.category}
                    </Badge>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-1">{gesture.label}</h3>
                  <p className="text-sm text-muted-foreground">{gesture.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                    Learn more <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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
                        <span className="text-5xl">{selected.emoji}</span>
                        <div>
                          <CardTitle className="font-display text-2xl">{selected.label}</CardTitle>
                          <CardDescription>{selected.description}</CardDescription>
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
