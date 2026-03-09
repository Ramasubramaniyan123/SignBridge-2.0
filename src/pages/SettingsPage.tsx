import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "next-themes";
import { Volume2, Gauge, Timer, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="container py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your SignBridge experience.</p>
        </div>

        <div className="space-y-4">
          {/* Theme */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Moon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Appearance</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  <Button
                    variant={theme === "light" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme("light")}
                    title="Light"
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme("dark")}
                    title="Dark"
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme("system")}
                    title="System"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text-to-Speech */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Volume2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Text-to-Speech</Label>
                    <p className="text-sm text-muted-foreground">Speak detected gestures aloud</p>
                  </div>
                </div>
                <Switch
                  checked={settings.speechEnabled}
                  onCheckedChange={(v) => updateSetting("speechEnabled", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Confidence */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-base font-semibold">
                    Confidence Threshold: {settings.confidenceThreshold}%
                  </Label>
                  <p className="text-sm text-muted-foreground">Minimum confidence to accept a detection</p>
                </div>
              </div>
              <Slider
                value={[settings.confidenceThreshold]}
                onValueChange={([v]) => updateSetting("confidenceThreshold", v)}
                min={50}
                max={99}
                step={1}
              />
            </CardContent>
          </Card>

          {/* Detection Interval */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-base font-semibold">
                    Detection Interval: {settings.detectionInterval}ms
                  </Label>
                  <p className="text-sm text-muted-foreground">How often to run gesture detection</p>
                </div>
              </div>
              <Slider
                value={[settings.detectionInterval]}
                onValueChange={([v]) => updateSetting("detectionInterval", v)}
                min={5000}
                max={15000}
                step={500}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
