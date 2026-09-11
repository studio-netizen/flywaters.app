import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import TagChipSelector from '@/components/TagChipSelector';
import { FISH_SPECIES, FISHING_TECHNIQUES, FISHING_GEAR } from '@/lib/fishing-constants';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location_tag: string | null;
  fish_species: string[] | null;
  fishing_technique: string[] | null;
  gear_used: string[] | null;
}

interface PostActionsMenuProps {
  post: Post;
  onUpdated: () => void;
}

const PostActionsMenu = ({ post, onUpdated }: PostActionsMenuProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [caption, setCaption] = useState(post.caption || '');
  const [location, setLocation] = useState<LocationResult | null>(
    post.location_tag ? { name: post.location_tag, address: post.location_tag, lat: 0, lng: 0 } : null
  );
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(post.fish_species || []);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>(post.fishing_technique || []);
  const [selectedGear, setSelectedGear] = useState<string[]>(post.gear_used || []);
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('posts').update({
        caption: caption || null,
        location_tag: location?.name || null,
        fish_species: selectedSpecies.length > 0 ? selectedSpecies : null,
        fishing_technique: selectedTechniques.length > 0 ? selectedTechniques : null,
        gear_used: selectedGear.length > 0 ? selectedGear : null,
      }).eq('id', post.id);
      if (error) throw error;
      toast.success('Post aggiornato!');
      setEditOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { deleteFromR2, isR2Url } = await import('@/lib/r2');
      if (isR2Url(post.image_url)) {
        await deleteFromR2(post.image_url);
      } else {
        // Legacy Supabase Storage cleanup
        try {
          const url = new URL(post.image_url);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/posts\/(.+)/);
          if (pathMatch) await supabase.storage.from('posts').remove([pathMatch[1]]);
        } catch { /* ignore */ }
      }
      await supabase.from('likes').delete().eq('post_id', post.id);
      await supabase.from('comments').delete().eq('post_id', post.id);
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      toast.success('Post eliminato');
      setDeleteOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Modifica post
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4" /> Elimina post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Didascalia</Label>
              <Textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Località</Label>
              <LocationPicker value={location} onChange={setLocation} placeholder="Cerca località..." />
            </div>
            <TagChipSelector label="Specie ittica" options={FISH_SPECIES} selected={selectedSpecies} onChange={setSelectedSpecies} />
            <TagChipSelector label="Tecnica di pesca" options={FISHING_TECHNIQUES} selected={selectedTechniques} onChange={setSelectedTechniques} />
            <TagChipSelector label="Attrezzatura utilizzata" options={FISHING_GEAR} selected={selectedGear} onChange={setSelectedGear} />
            <Button onClick={handleEdit} className="w-full" disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina post</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo post? L'azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostActionsMenu;
