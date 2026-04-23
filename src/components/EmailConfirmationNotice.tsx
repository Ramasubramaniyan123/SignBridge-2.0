import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailConfirmationNoticeProps {
  email: string;
  onResendConfirmation: (email: string) => Promise<void>;
  loading?: boolean;
}

export function EmailConfirmationNotice({ 
  email, 
  onResendConfirmation, 
  loading = false 
}: EmailConfirmationNoticeProps) {
  const { toast } = useToast();

  const handleResend = async () => {
    try {
      await onResendConfirmation(email);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend confirmation email",
        variant: "destructive"
      });
    }
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium text-amber-800">Email confirmation required</p>
          <p className="text-sm text-amber-700">
            Please check your inbox at <strong>{email}</strong> and click the confirmation link to activate your account.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={loading}
          className="ml-4 whitespace-nowrap"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
