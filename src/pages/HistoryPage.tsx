import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDetectionHistory } from "@/hooks/use-detection-history";
import { Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { history, clearHistory } = useDetectionHistory();

  return (
    <div className="container py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Detection History
            </h1>
            <p className="text-muted-foreground">
              {history.length} gesture{history.length !== 1 ? "s" : ""} detected
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">No detections yet</p>
              <p className="text-sm">Start detecting gestures to see your history here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.5) }}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {record.label === "Hello" && "👋"}
                        {record.label === "Thank You" && "🙏"}
                        {record.label === "Yes" && "👍"}
                        {record.label === "No" && "👎"}
                        {record.label === "Help" && "🆘"}
                        {["A", "E", "I", "O", "U"].includes(record.label) && "🤟"}
                      </div>
                      <div>
                        <p className="font-semibold">{record.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(record.timestamp, "h:mm a · MMM d")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={record.confidence >= 90 ? "default" : "secondary"}>
                      {record.confidence}%
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
