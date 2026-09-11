import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

const InviteShareDialog = ({ open, onOpenChange, username }: Props) => {
  const link = `https://flywaters.app/invito/${username}`;
  const waText = `Ti invito su Flywaters! La community per la pesca a mosca 🎣 ${link}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiato!');
    } catch {
      toast.error('Impossibile copiare il link');
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Flywaters',
          text: 'Ti invito su Flywaters! La community per la pesca a mosca 🎣',
          url: link,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invita un amico su Flywaters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground break-all">
            {link}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={copyLink} variant="outline" className="rounded-full justify-start gap-2">
              <Copy className="w-4 h-4" /> Copia link
            </Button>
            <Button
              onClick={shareWhatsApp}
              className="rounded-full justify-start gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white"
            >
              <span className="text-base leading-none">💬</span> Condividi su WhatsApp
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button onClick={nativeShare} variant="outline" className="rounded-full justify-start gap-2">
                <Share2 className="w-4 h-4" /> Condividi
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteShareDialog;
