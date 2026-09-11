import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, Globe, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, validateImageFile } from '@/lib/image-compression';
import { uploadToR2 } from '@/lib/r2';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const CATEGORIES = ['Spot', 'Tecniche', 'Specie', 'Attrezzatura', 'Community'];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function wordCount(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function readingTime(words: number) {
  return Math.max(1, Math.ceil(words / 200));
}

interface PostData {
  title: string;
  slug: string;
  cover_image_url: string;
  cover_image_alt: string;
  body_html: string;
  excerpt: string;
  author: string;
  status: string;
  published_at: string;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  category: string;
  tags: string[];
  reading_time_minutes: number;
}

const defaultPost: PostData = {
  title: '',
  slug: '',
  cover_image_url: '',
  cover_image_alt: '',
  body_html: '',
  excerpt: '',
  author: 'Team Flywaters',
  status: 'draft',
  published_at: new Date().toISOString().slice(0, 16),
  seo_title: '',
  meta_description: '',
  focus_keyword: '',
  category: '',
  tags: [],
  reading_time_minutes: 1,
};

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const btn = (active: boolean) =>
    `px-2 py-1 text-xs rounded font-medium transition-colors ${active ? 'bg-[#242242] text-white' : 'bg-muted hover:bg-muted/80'}`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
      <button className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
      <div className="w-px h-6 bg-border mx-1" />
      <button className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
      <button className={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
      <div className="w-px h-6 bg-border mx-1" />
      <button className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</button>
      <button className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lista</button>
      <div className="w-px h-6 bg-border mx-1" />
      <button className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝ Citazione</button>
      <button className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>— Linea</button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        className={btn(editor.isActive('link'))}
        onClick={() => {
          const url = prompt('URL del link:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >🔗 Link</button>
      <button
        className={btn(false)}
        onClick={() => {
          const url = prompt('URL dell\'immagine:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      >🖼 Immagine</button>
    </div>
  );
}

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { adminFetch } = useAdminApi();
  const { token: adminToken } = useAdminAuth();
  const [post, setPost] = useState<PostData>(defaultPost);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false }),
      Underline,
      Image,
      Placeholder.configure({ placeholder: 'Inizia a scrivere il tuo articolo…' }),
    ],
    content: post.body_html,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const words = wordCount(html);
      setPost(p => ({
        ...p,
        body_html: html,
        reading_time_minutes: readingTime(words),
      }));
    },
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await adminFetch('get_blog_post', { id });
        if (data) {
          setPost({
            ...defaultPost,
            ...data,
            published_at: data.published_at
              ? new Date(data.published_at).toISOString().slice(0, 16)
              : new Date().toISOString().slice(0, 16),
            tags: data.tags || [],
          });
          setTagsInput((data.tags || []).join(', '));
          setSlugManual(true);
          editor?.commands.setContent(data.body_html || '');
        }
      } catch {
        toast.error('Errore nel caricamento');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateField = useCallback((field: keyof PostData, value: any) => {
    setPost(p => {
      const next = { ...p, [field]: value };
      if (field === 'title' && !slugManual) {
        next.slug = slugify(value);
      }
      return next;
    });
  }, [slugManual]);

  const handleCoverUpload = async (file: File) => {
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const result = await compressImage(file, 'blog');
      const publicUrl = await uploadToR2(result.file, 'blog', { adminToken: adminToken || undefined });
      updateField('cover_image_url', publicUrl);
      toast.success('Immagine caricata');
    } catch {
      toast.error('Errore nel caricamento. Riprova.');
    } finally {
      setUploading(false);
    }
  };

  const save = async (status?: string) => {
    if (!post.title || !post.slug) {
      toast.error('Titolo e slug sono obbligatori');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...post,
        status: status || post.status,
        published_at: (status === 'published' || post.status === 'published')
          ? new Date(post.published_at).toISOString()
          : null,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      };
      await adminFetch('save_blog_post', { id: id || null, post: payload });
      toast.success(status === 'published' ? 'Articolo pubblicato!' : 'Bozza salvata');
      navigate('/admin/blog');
    } catch (e: any) {
      toast.error(e.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Caricamento…</p>;

  const seoTitleLen = (post.seo_title || '').length;
  const metaDescLen = (post.meta_description || '').length;
  const words = wordCount(post.body_html);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">{id ? 'Modifica articolo' : 'Nuovo articolo'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column — Content */}
        <div className="space-y-5">
          <div>
            <Input
              value={post.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="Titolo dell'articolo"
              className="text-2xl font-bold border-0 border-b rounded-none px-0 focus-visible:border-[#242242] h-auto py-3"
            />
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{post.reading_time_minutes} min di lettura</span>
              <span>{words} parole</span>
            </div>
          </div>

          {/* Cover image upload area */}
          <div>
            {post.cover_image_url ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={post.cover_image_url} alt={post.cover_image_alt || ''} className="w-full aspect-video object-cover" />
                <button
                  onClick={() => updateField('cover_image_url', '')}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#242242]/40 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Trascina un'immagine o clicca per caricare</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverUpload(f);
                  }}
                />
              </label>
            )}
            {uploading && <p className="text-xs text-muted-foreground mt-1">Caricamento in corso...</p>}
          </div>

          {/* TipTap editor */}
          <div className="border rounded-lg overflow-hidden min-h-[400px]">
            <EditorToolbar editor={editor} />
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none p-4 min-h-[350px] focus:outline-none [&_.ProseMirror]:min-h-[350px] [&_.ProseMirror]:outline-none"
            />
          </div>

          {/* Excerpt */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Estratto</Label>
            <Textarea
              value={post.excerpt}
              onChange={e => updateField('excerpt', e.target.value)}
              placeholder="Breve descrizione dell'articolo…"
              rows={2}
            />
          </div>
        </div>

        {/* Right column — Settings */}
        <div className="space-y-6">
          {/* Pubblicazione */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm">Pubblicazione</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm">Stato:</span>
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                {post.status === 'published' ? 'Pubblicato' : 'Bozza'}
              </Badge>
            </div>
            <div>
              <Label className="text-xs">Data pubblicazione</Label>
              <Input
                type="datetime-local"
                value={post.published_at}
                onChange={e => updateField('published_at', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Autore</Label>
              <Input
                value={post.author}
                onChange={e => updateField('author', e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => save('draft')} disabled={saving} className="flex-1 gap-1.5">
                <Save className="h-3.5 w-3.5" /> Salva bozza
              </Button>
              <Button size="sm" onClick={() => save('published')} disabled={saving} className="flex-1">
                Pubblica
              </Button>
            </div>
          </div>

          {/* Immagine di copertina settings */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Immagine di copertina</h3>
            <div>
              <Label className="text-xs">URL immagine</Label>
              <Input
                value={post.cover_image_url}
                onChange={e => updateField('cover_image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            {post.cover_image_url && (
              <img src={post.cover_image_url} alt="" className="w-full aspect-video object-cover rounded-lg" />
            )}
            <div>
              <Label className="text-xs">Testo alternativo (SEO)</Label>
              <Input
                value={post.cover_image_alt}
                onChange={e => updateField('cover_image_alt', e.target.value)}
                placeholder="Descrizione dell'immagine…"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" /> SEO
            </h3>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input
                value={post.slug}
                onChange={e => { setSlugManual(true); updateField('slug', e.target.value); }}
                placeholder="titolo-articolo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                flywaters.app/blog/{post.slug || '…'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Titolo SEO</Label>
                <span className={`text-xs ${seoTitleLen > 60 ? 'text-red-500' : 'text-green-600'}`}>
                  {seoTitleLen}/60
                </span>
              </div>
              <Input
                value={post.seo_title}
                onChange={e => updateField('seo_title', e.target.value)}
                placeholder="Titolo per i motori di ricerca"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Meta description</Label>
                <span className={`text-xs ${metaDescLen > 160 ? 'text-red-500' : 'text-green-600'}`}>
                  {metaDescLen}/160
                </span>
              </div>
              <Textarea
                value={post.meta_description}
                onChange={e => updateField('meta_description', e.target.value)}
                placeholder="Descrizione per i motori di ricerca"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Focus keyword</Label>
              <Input
                value={post.focus_keyword}
                onChange={e => updateField('focus_keyword', e.target.value)}
                placeholder="es. pesca a mosca italia"
              />
            </div>

            {/* Google preview */}
            <div className="bg-white border rounded-lg p-3 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground mb-1">Anteprima Google</p>
              <p className="text-xs text-green-700 truncate">
                flywaters.app › blog › {post.slug || '…'}
              </p>
              <p className="text-sm font-medium text-blue-800 truncate">
                {post.seo_title || post.title || 'Titolo articolo'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {post.meta_description || post.excerpt || 'Descrizione dell\'articolo…'}
              </p>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Categorie e tag</h3>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={post.category} onValueChange={v => updateField('category', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona…" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tag (separati da virgola)</Label>
              <Input
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="fly fishing, trota, mosca secca"
              />
              {tagsInput && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
