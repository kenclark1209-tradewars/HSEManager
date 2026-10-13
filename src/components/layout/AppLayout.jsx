import { useState, useEffect } from 'react';
import { runAIEngine } from '@/lib/aiEngine';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import UserGuideDialog from '@/components/guide/UserGuideDialog';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Run AI engine on app load (proactive mode) — silent background scan
  useEffect(() => {
    const lastRun = sessionStorage.getItem('ai_engine_ran');
    if (!lastRun) {
      sessionStorage.setItem('ai_engine_ran', '1');
      // Delay 3s to let app load first
      setTimeout(() => {
        runAIEngine().catch(e => console.warn('[AI-ENGINE] Background scan error:', e));
      }, 3000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        collapsed ? "ml-16" : "ml-60"
      )}>
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Floating user guide button */}
      <Button
        onClick={() => setShowGuide(true)}
        className="fixed bottom-6 right-6 z-50 shadow-lg gap-2 rounded-full h-11 px-5"
        title="Hướng dẫn sử dụng"
      >
        <BookOpen className="w-4 h-4" />
        Hướng dẫn sử dụng
      </Button>

      <UserGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    </div>
  );
}