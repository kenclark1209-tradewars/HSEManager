import { useState, useEffect } from 'react';
import { t, setLanguage, getLanguage, getLanguages } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe, User, Shield, Bot } from 'lucide-react';
import AIConfigPanel from '@/components/ai/AIConfigPanel';

export default function Settings() {
  const [lang, setLang] = useState(getLanguage());
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLangChange = (v) => {
    setLang(v);
    setLanguage(v);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5" />
                Cấu hình AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIConfigPanel />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={lang} onValueChange={handleLangChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {getLanguages().map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              {t('profile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">{t('title')}:</span> <span className="font-medium">{user.full_name || '-'}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user.email}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t('role')}:</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Shield className="w-3.5 h-3.5" />
                    {user.role || 'user'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}