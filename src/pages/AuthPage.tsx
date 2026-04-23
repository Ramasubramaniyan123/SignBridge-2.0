import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hand, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "signin" | "signup" | "forgot" | "phone" | "phone-signup";

export default function AuthPage() {
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneDisplayName, setPhoneDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resendConfirmation, signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "forgot") {
      // TODO: Implement password reset with your custom API
      toast({ 
        title: "Feature coming soon!", 
        description: "Password reset will be available in the next update." 
      });
      setView("signin");
      return;
    }

    if (view === "phone" || view === "phone-signup") {
      if (!phoneNumber.trim()) {
        toast({ title: "Phone required", description: "Please enter your phone number.", variant: "destructive" });
        return;
      }
      
      if (view === "phone-signup" && !phoneDisplayName.trim()) {
        toast({ title: "Name required", description: "Please enter your display name.", variant: "destructive" });
        return;
      }
      
      if (!otpSent) {
        // Send OTP
        setLoading(true);
        try {
          console.log("Sending OTP to:", phoneNumber);
          const { error } = await signInWithPhone(phoneNumber);
          console.log("OTP send result:", { error });
          
          if (error) throw error;
          
          setOtpSent(true);
          toast({ 
            title: "OTP Sent!", 
            description: "Please check your phone for the verification code." 
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          console.error("Phone sign-in error:", err);
          toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      } else {
        // Verify OTP
        if (!otpCode.trim()) {
          toast({ title: "OTP required", description: "Please enter the verification code.", variant: "destructive" });
          return;
        }
        
        setLoading(true);
        try {
          console.log("Verifying OTP for:", phoneNumber);
          const { error } = await verifyPhoneOTP(phoneNumber, otpCode);
          console.log("OTP verification result:", { error });
          
          if (error) throw error;
          
          // If this is phone signup and user provided a name, update their profile
          if (view === "phone-signup" && phoneDisplayName.trim()) {
            // Note: Profile update would need to be handled after successful OTP verification
            // For now, we'll just show success and navigate
            toast({ 
              title: "Account Created!", 
              description: `Welcome ${phoneDisplayName}! Your account has been created successfully.` 
            });
          } else {
            toast({ title: "Welcome back!" });
          }
          
          navigate("/");
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          console.error("OTP verification error:", err);
          toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (view === "signup") {
        console.log("Attempting signup with:", email);
        const { error } = await signUp(email, password, displayName || undefined);
        console.log("Signup result:", { error });
        if (error) throw error;
        toast({ 
          title: "Account created!", 
          description: "Please check your email to confirm your account before signing in." 
        });
        setView("signin");
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          // Check if the error is related to email confirmation
          if (error.message?.includes("Email not confirmed") || error.message?.includes("email_confirmed")) {
            toast({ 
              title: "Email not confirmed", 
              description: "Please check your email for a confirmation link. Click 'Resend confirmation' if you need a new email.",
              variant: "destructive",
              action: (
                <button
                  onClick={() => handleResendConfirmation(email)}
                  className="text-xs underline"
                >
                  Resend confirmation
                </button>
              )
            });
          } else {
            throw error;
          }
        } else {
          toast({ title: "Welcome back!" });
          navigate("/");
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async (email: string) => {
    if (!email.trim()) {
      toast({ 
        title: "Email required", 
        description: "Please enter your email address to resend confirmation.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting to resend confirmation to:", email);
      const { error } = await resendConfirmation(email);
      console.log("Resend result:", { error });
      
      if (error) throw error;
      
      toast({ 
        title: "Confirmation email sent!", 
        description: "Please check your inbox for the confirmation link." 
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Resend confirmation error:", err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log("Attempting Google sign-in");
      const { error } = await signInWithGoogle();
      console.log("Google sign-in result:", { error });
      
      if (error) throw error;
      
      toast({ 
        title: "Redirecting to Google...", 
        description: "Please complete the sign-in process with Google." 
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Google sign-in error:", err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<View, { title: string; desc: string }> = {
    signin: { title: "Welcome Back", desc: "Sign in to continue" },
    signup: { title: "Create Account", desc: "Sign up to save your detection history" },
    forgot: { title: "Reset Password", desc: "Enter your email to receive a reset link" },
    phone: { title: "Phone Sign In", desc: "Enter your phone number to receive a code" },
    "phone-signup": { title: "Sign Up with Phone", desc: "Create account using your phone number" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Hand className="h-7 w-7 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold">
            Sign<span className="text-primary">Bridge</span>
          </h1>
          <p className="text-muted-foreground mt-1">Indian Sign Language Detection</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{titles[view].title}</CardTitle>
            <CardDescription>{titles[view].desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9"
                    maxLength={50}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              {view !== "forgot" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {view === "phone" && (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number (with country code)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-9"
                      required
                      disabled={otpSent}
                    />
                  </div>
                  
                  {otpSent && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter verification code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="pl-9"
                        required
                        maxLength={6}
                      />
                    </div>
                  )}
                </>
              )}

              {view === "phone-signup" && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Display name"
                      value={phoneDisplayName}
                      onChange={(e) => setPhoneDisplayName(e.target.value)}
                      className="pl-9"
                      required
                      disabled={otpSent}
                      maxLength={50}
                    />
                  </div>
                  
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number (with country code)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-9"
                      required
                      disabled={otpSent}
                    />
                  </div>
                  
                  {otpSent && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter verification code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="pl-9"
                        required
                        maxLength={6}
                      />
                    </div>
                  )}
                </>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : view === "signup"
                  ? "Create Account"
                  : view === "forgot"
                  ? "Send Reset Link"
                  : view === "phone"
                  ? (otpSent ? "Verify Code" : "Send Code")
                  : view === "phone-signup"
                  ? (otpSent ? "Verify Code" : "Send Code")
                  : "Sign In"}
              </Button>

              {view !== "forgot" && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              {view === "forgot" ? (
                <button
                  onClick={() => setView("signin")}
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              ) : view === "phone" ? (
                <button
                  onClick={() => {
                    setView("signin");
                    setOtpSent(false);
                    setOtpCode("");
                    setPhoneNumber("");
                  }}
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              ) : view === "phone-signup" ? (
                <button
                  onClick={() => {
                    setView("signin");
                    setOtpSent(false);
                    setOtpCode("");
                    setPhoneNumber("");
                    setPhoneDisplayName("");
                  }}
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              ) : (
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">
                      {view === "signup" ? "Already have an account?" : "Don't have an account?"}
                    </span>{" "}
                    <button
                      onClick={() => setView(view === "signup" ? "signin" : "signup")}
                      className="text-primary font-medium hover:underline"
                    >
                      {view === "signup" ? "Sign in" : "Sign up"}
                    </button>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Or sign {view === "signup" ? "up" : "in"} with</span>{" "}
                    <button
                      onClick={() => {
                        setView(view === "signup" ? "phone-signup" : "phone");
                        setOtpSent(false);
                        setOtpCode("");
                        setPhoneNumber("");
                        setPhoneDisplayName("");
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Phone Number
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
