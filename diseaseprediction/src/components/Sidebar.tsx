import React from 'react';
import {
  Upload,
  Database,
  GitFork,
  Network,
  Layers,
  Brain,
  ChevronRight,
  PanelLeftClose,
  X,
  Stethoscope,
  RefreshCw,
  Sparkles,
  Activity,
  CheckCircle2,
  Dna,
  Zap,
  Sliders
} from 'lucide-react';

interface SidebarProps {
  activeModule: number;
  setActiveModule: (mod: number) => void;
  activeSubView: string;
  setActiveSubView: (view: string) => void;
  datasetName: string;
  totalRows: number;
  isProcessed: boolean;
  onLoadMaster: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

interface NavigationItem {
  id: string;
  numStr: string;
  stageNum: number;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    activeBorder: string;
    ring: string;
    gradient: string;
  };
  moduleNum: number;
  subView: string;
  isActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  activeSubView,
  setActiveSubView,
  datasetName,
  totalRows,
  isProcessed,
  onLoadMaster,
  mobileOpen,
  setMobileOpen,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const handleItemClick = (moduleNum: number, subView: string) => {
    setActiveModule(moduleNum);
    setActiveSubView(subView);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5 Dedicated Clinical Workflow Items requested by the user:
  // 1. dataset upload
  // 2. feature discovery
  // 3. feature interaction
  // 4. hierarchical
  // 5. prediction
  const navItems: NavigationItem[] = [
    {
      id: 'dataset-upload',
      numStr: '01',
      stageNum: 1,
      title: 'Dataset Upload',
      tagline: 'Cohort Ingestion, Imputation & Summary',
      icon: Upload,
      accentColor: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100',
        badge: 'bg-indigo-100 text-indigo-700',
        activeBorder: 'border-indigo-400',
        ring: 'ring-indigo-300/40',
        gradient: 'from-indigo-50/90 via-indigo-50/30 to-white',
      },
      moduleNum: 1,
      subView: 'm1-all',
      isActive: activeModule === 1,
    },
    {
      id: 'feature-discovery',
      numStr: '02',
      stageNum: 2,
      title: 'Feature Discovery',
      tagline: '19 Validated Biomarkers & Output Heads',
      icon: GitFork,
      accentColor: {
        bg: 'bg-sky-50',
        text: 'text-sky-600',
        border: 'border-sky-100',
        badge: 'bg-sky-100 text-sky-700',
        activeBorder: 'border-sky-400',
        ring: 'ring-sky-300/40',
        gradient: 'from-sky-50/90 via-sky-50/30 to-white',
      },
      moduleNum: 2,
      subView: 'm2-all',
      isActive: activeModule === 2,
    },
    {
      id: 'feature-interaction',
      numStr: '03',
      stageNum: 3,
      title: 'Feature Interaction',
      tagline: '513 Pairwise Interactions & Network Graph',
      icon: Network,
      accentColor: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-100',
        badge: 'bg-purple-100 text-purple-700',
        activeBorder: 'border-purple-400',
        ring: 'ring-purple-300/40',
        gradient: 'from-purple-50/90 via-purple-50/30 to-white',
      },
      moduleNum: 3,
      subView: 'm3-interactions',
      isActive: activeModule === 3 && activeSubView === 'm3-interactions',
    },
    {
      id: 'hierarchical',
      numStr: '04',
      stageNum: 4,
      title: 'Hierarchical',
      tagline: 'Disease Patterns, Trees & Signatures',
      icon: Layers,
      accentColor: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
        badge: 'bg-amber-100 text-amber-700',
        activeBorder: 'border-amber-400',
        ring: 'ring-amber-300/40',
        gradient: 'from-amber-50/90 via-amber-50/30 to-white',
      },
      moduleNum: 3,
      subView: 'm3-patterns',
      isActive:
        activeModule === 3 &&
        (activeSubView === 'm3-patterns' || activeSubView === 'm3-signatures'),
    },
    {
      id: 'prediction',
      numStr: '05',
      stageNum: 5,
      title: 'Disease Progression',
      tagline: '5-Year Risk Trajectory & Future Evolution',
      icon: Brain,
      accentColor: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        badge: 'bg-emerald-100 text-emerald-700',
        activeBorder: 'border-emerald-400',
        ring: 'ring-emerald-300/40',
        gradient: 'from-emerald-50/90 via-emerald-50/30 to-white',
      },
      moduleNum: 4,
      subView: 'm4-progression',
      isActive: activeModule === 4,
    },
  ];

  // Determine current active stage number (1 to 5) for progress bar
  const activeStage = navItems.find((item) => item.isActive)?.stageNum || 1;
  const activeStageTitle = navItems.find((item) => item.isActive)?.title || 'Dataset Upload';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Creative Light Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 lg:h-screen z-50 bg-white/95 backdrop-blur-md border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 shadow-xs ${
          isCollapsed
            ? 'w-0 lg:w-0 lg:p-0 lg:border-r-0 lg:opacity-0 lg:overflow-hidden pointer-events-none'
            : 'w-80 xl:w-92 lg:opacity-100'
        } ${
          mobileOpen ? 'translate-x-0 !pointer-events-auto' : isCollapsed ? '-translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto p-5 custom-scrollbar">
          {/* Sidebar Header Brand & Hide/Close Actions */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
                <Stethoscope className="w-5 h-5 text-indigo-100" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-black text-slate-900 tracking-tight truncate">
                    Clinical AI Studio
                  </h1>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase block">
                  Diagnostic Pipeline
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Desktop Hide/Collapse Sidebar Toggle */}
              {setIsCollapsed && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                  title="Hide sidebar menu"
                  aria-label="Hide sidebar menu"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              {/* Mobile Close Button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Creative Pipeline Progress Strip */}
          <div className="mb-4 bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Stage {activeStage} of 5
              </span>
              <span className="text-[11px] font-bold text-indigo-700 truncate max-w-[140px]">
                {activeStageTitle}
              </span>
            </div>
            {/* 5-segment indicator bar */}
            <div className="grid grid-cols-5 gap-1.5 h-1.5">
              {[1, 2, 3, 4, 5].map((st) => (
                <div
                  key={st}
                  className={`h-full rounded-full transition-all duration-300 ${
                    st <= activeStage
                      ? 'bg-indigo-600 shadow-2xs'
                      : 'bg-slate-200/90'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Section Sub-heading */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Workflow Navigation
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              5 Core Views
            </span>
          </div>

          {/* The 5 Requested Sidebar Navigation Items */}
          <nav className="space-y-2.5 flex-1">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const isItemActive = item.isActive;

              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl border transition-all duration-200 overflow-hidden group cursor-pointer ${
                    isItemActive
                      ? `${item.accentColor.activeBorder} bg-gradient-to-r ${item.accentColor.gradient} shadow-xs ring-2 ${item.accentColor.ring}`
                      : 'border-slate-200/80 bg-white/70 hover:bg-slate-50 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                  onClick={() => handleItemClick(item.moduleNum, item.subView)}
                >
                  {/* Left Active Indicator Bar */}
                  {isItemActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r" />
                  )}

                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1 pl-1">
                      {/* Monospace Step Number Badge */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-[11px] shrink-0 transition-colors ${
                          isItemActive
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                        }`}
                      >
                        {item.numStr}
                      </div>

                      {/* Icon with Color Badge */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isItemActive
                            ? `${item.accentColor.bg} ${item.accentColor.text} border ${item.accentColor.border}`
                            : 'bg-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50/80'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                      </div>

                      {/* Item Title & Subtitle */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h2
                            className={`text-xs font-bold leading-tight truncate transition-colors ${
                              isItemActive
                                ? 'text-slate-900 font-extrabold'
                                : 'text-slate-700 group-hover:text-slate-900'
                            }`}
                          >
                            {item.title}
                          </h2>
                          {isItemActive && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                              Active
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10.5px] truncate mt-0.5 leading-snug transition-colors ${
                            isItemActive
                              ? 'text-slate-600 font-medium'
                              : 'text-slate-400 group-hover:text-slate-500'
                          }`}
                        >
                          {item.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Right Chevron Arrow */}
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-all ml-2 ${
                        isItemActive
                          ? 'text-indigo-600 translate-x-0.5'
                          : 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom Active Dataset & Actions Card (Light Theme) */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-3">
            <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase font-bold tracking-wider">
                  Active Clinical Cohort
                </span>
                <span className="flex items-center space-x-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isProcessed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-[10px] font-medium text-emerald-700">
                    {isProcessed ? 'Ready' : 'Pending'}
                  </span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span
                  className="text-xs font-bold text-slate-800 truncate max-w-[170px]"
                  title={datasetName}
                >
                  {datasetName}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                <span>Total Records:</span>
                <span className="text-indigo-600 font-bold">
                  {totalRows.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onLoadMaster}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Master Dataset</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
