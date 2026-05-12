'use client';

import { useCallback, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { fileToBase64, base64ToDataURL, saveFile } from '@/lib/storage';

interface BrandingPanelProps {
  onClose: () => void;
}

export function BrandingPanel({ onClose }: BrandingPanelProps) {
  const { project, updateBranding } = useTourProjectStore();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const branding = project?.branding;

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !project) return;

      try {
        const base64 = await fileToBase64(file);
        const dataUrl = base64ToDataURL(base64, file.type);
        await saveFile(project.id, 'branding-logo', base64, file.type, file.name);
        updateBranding({ logo: dataUrl });
      } catch (error) {
        console.error('Failed to upload logo:', error);
      }
    },
    [project, updateBranding]
  );

  const handleRemoveLogo = useCallback(() => {
    updateBranding({ logo: undefined });
  }, [updateBranding]);

  if (!project) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">Branding</h3>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-xs">Logo</Label>
            {branding?.logo ? (
              <div className="relative rounded-md border p-2 bg-muted/30">
                <img
                  src={branding.logo}
                  alt="Brand logo"
                  className="max-h-20 mx-auto object-contain"
                />
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={handleRemoveLogo}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 h-16 border-dashed"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Upload Logo
              </Button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="text-xs">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding?.primaryColor || '#3B82F6'}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                className="size-8 rounded border cursor-pointer"
              />
              <Input
                value={branding?.primaryColor || '#3B82F6'}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                className="h-8 text-xs font-mono"
                maxLength={7}
              />
            </div>
          </div>

          <Separator />

          {/* Company Name */}
          <div className="space-y-2">
            <Label className="text-xs">Company Name</Label>
            <Input
              value={branding?.companyName || ''}
              onChange={(e) => updateBranding({ companyName: e.target.value })}
              placeholder="Your company name"
              className="h-8 text-sm"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <Label className="text-xs">Contact Info</Label>
            <Textarea
              value={branding?.contactInfo || ''}
              onChange={(e) => updateBranding({ contactInfo: e.target.value })}
              placeholder="Phone, email, website..."
              className="min-h-[80px] text-sm"
              rows={3}
            />
          </div>

          <Separator />

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Preview</Label>
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{ borderTopColor: branding?.primaryColor || '#3B82F6', borderTopWidth: 3 }}
            >
              <div className="flex items-center gap-2">
                {branding?.logo && (
                  <img
                    src={branding.logo}
                    alt="Logo"
                    className="size-8 object-contain rounded"
                  />
                )}
                <span className="text-sm font-semibold">
                  {branding?.companyName || 'Your Company'}
                </span>
              </div>
              {branding?.contactInfo && (
                <p className="text-[10px] text-muted-foreground">{branding.contactInfo}</p>
              )}
              <div
                className="h-6 rounded text-[10px] text-white flex items-center justify-center"
                style={{ backgroundColor: branding?.primaryColor || '#3B82F6' }}
              >
                Brand Color
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
