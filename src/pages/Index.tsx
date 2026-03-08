import { Link } from "react-router-dom";
import { Camera, BookOpen, Clock, ArrowRight, Sparkles, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    icon: Camera,
    title: "Real-Time Detection",
    description: "Detect Indian Sign Language gestures using your webcam with instant feedback.",
    to: "/detect",
    color: "primary",
  },
  {
    icon: BookOpen,
    title: "Learn ISL",
    description: "Browse gesture cards with instructions and practice at your own pace.",
    to: "/learn",
    color: "accent",
  },
  {
    icon: Clock,
    title: "Detection History",
    description: "Review all your detected gestures with timestamps and confidence scores.",
    to: "/history",
    color: "info",
  },
];

const stats = [
  { label: "Gestures", value: "40+", icon: Sparkles },
  { label: "Real-Time", value: "<200ms", icon: Zap },
  { label: "Offline", value: "Yes", icon: Globe },
];

export default function Index() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Indian Sign Language Detection
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Bridging the Gap with{" "}
              <span className="text-gradient">Sign Language</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              SignBridge detects Indian Sign Language gestures in real time using your webcam,
              converting them to text and speech instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="glow-primary text-base px-8">
                <Link to="/detect">
                  Start Detection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/learn">Learn ISL</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-8 md:gap-16 mt-16"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl md:text-3xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Detect, learn, and track your progress with ISL gestures.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <Link to={feature.to}>
                <Card className="group h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom spacer for mobile nav */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
