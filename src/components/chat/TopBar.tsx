import { Trash2, Lightbulb, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TopBarProps {
  onClearChat: () => void;
  showSetupFirst: boolean;
  onShowSetupFirstChange: (value: boolean) => void;
  woodyCoaching: boolean;
  onWoodyCoachingChange: (value: boolean) => void;
}

export function TopBar({
  onClearChat,
  showSetupFirst,
  onShowSetupFirstChange,
  woodyCoaching,
  onWoodyCoachingChange,
}: TopBarProps) {
  return (
    <header className="h-12 px-5 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between gap-4">
      {/* Left section */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearChat}
          className="h-8 px-3 text-[12px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors rounded-md"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Clear Chat
        </Button>
      </div>

      {/* Right section - Toggles */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Switch
            id="setup-first"
            checked={showSetupFirst}
            onCheckedChange={onShowSetupFirstChange}
            className="data-[state=checked]:bg-primary h-4 w-7"
          />
          <Label 
            htmlFor="setup-first" 
            className="text-[11px] font-medium text-muted-foreground cursor-pointer flex items-center gap-1.5 tracking-wide"
          >
            <Lightbulb className="w-3 h-3" />
            Show Setup First
          </Label>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Switch
            id="woody-coaching"
            checked={woodyCoaching}
            onCheckedChange={onWoodyCoachingChange}
            className="data-[state=checked]:bg-primary h-4 w-7"
          />
          <Label 
            htmlFor="woody-coaching" 
            className="text-[11px] font-medium text-muted-foreground cursor-pointer flex items-center gap-1.5 tracking-wide"
          >
            <MessageSquare className="w-3 h-3" />
            Woody Coaching
          </Label>
        </div>
      </div>
    </header>
  );
}
