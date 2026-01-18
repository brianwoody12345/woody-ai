import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Sigma, BarChart3, Layers, GitBranch, ChevronRight } from 'lucide-react';
import type { Topic, TopicId } from '@/types/chat';

const topics: Topic[] = [
  { id: 'techniques-integration', label: 'Techniques of Integration' },
  { id: 'series', label: 'Series' },
  { id: 'power-series-taylor', label: 'Power Series & Taylor' },
  { id: 'applications-integration', label: 'Applications of Integration' },
];

const topicIcons: Record<TopicId, React.ElementType> = {
  'techniques-integration': Sigma,
  'series': TrendingUp,
  'power-series-taylor': BarChart3,
  'applications-integration': Layers,
  'calc-iii': BookOpen,
  'differential-equations': GitBranch,
};

interface SidebarProps {
  activeTopic: TopicId;
  onTopicChange: (topic: TopicId) => void;
}

export function Sidebar({ activeTopic, onTopicChange }: SidebarProps) {
  return (
    <aside className="w-72 min-h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-sidebar-border">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Woody Calculus Clone AI
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/15 text-primary rounded-sm border border-primary/25">
              Beta
            </span>
          </div>
          <p className="text-[13px] font-medium text-primary/80 tracking-wide">
            AI Private Professor
          </p>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
          Modules
        </p>
        {topics.map((topic, index) => {
          const Icon = topicIcons[topic.id];
          const isActive = activeTopic === topic.id;
          const isDisabled = topic.disabled;

          return (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              onClick={() => !isDisabled && onTopicChange(topic.id)}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] font-medium
                transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : isDisabled
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                }
              `}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'opacity-60'}`} />
              <span className="flex-1 truncate">{topic.label}</span>
              {topic.comingSoon && (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                  Soon
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-primary/70" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground/70 font-medium tracking-wide">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>AI Ready</span>
        </div>
      </div>
    </aside>
  );
}
