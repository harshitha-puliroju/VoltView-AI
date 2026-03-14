import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Battery, 
  DollarSign, 
  Activity, 
  Map as MapIcon, 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Bell,
  Sun,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface DashboardStats {
  totalEnergy: string;
  totalRevenue: string;
  totalSessions: number;
  activeSessions: number;
  networkStatus: { Status: string; count: number }[];
  peakDemand: string;
}

interface Station {
  StationID: number;
  StationName: string;
  Location: string;
  ChargerType: string;
  TotalEnergyDelivered: number;
  Status: string;
  InstallationDate: string;
  Lat: number;
  Lng: number;
}

interface EnergyData {
  hour: string;
  consumption: number;
  solar: number;
}

interface RevenueData {
  StationName: string;
  revenue: number;
}

interface Insight {
  id: number;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
}

// --- Components ---

const StatCard = ({ title, value, icon: Icon, subtext, trend }: any) => (
  <div className="glass-card p-6 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon size={24} />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold mt-1 font-display">{value}</h3>
      {subtext && <p className="text-gray-500 text-xs mt-2">{subtext}</p>}
    </div>
  </div>
);

const InsightCard = ({ insight }: { insight: Insight }) => {
  const icons = {
    warning: <AlertCircle className="text-amber-400" size={20} />,
    success: <CheckCircle2 className="text-emerald-400" size={20} />,
    info: <Info className="text-brand-blue" size={20} />
  };

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4 items-start hover:bg-white/10 transition-colors">
      <div className="mt-1">{icons[insight.type]}</div>
      <div>
        <h4 className="font-semibold text-sm">{insight.title}</h4>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{insight.description}</p>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, stationsRes, energyRes, revenueRes, insightsRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/stations'),
          fetch('/api/analytics/energy'),
          fetch('/api/analytics/revenue'),
          fetch('/api/ai-insights')
        ]);

        setStats(await statsRes.json());
        setStations(await stationsRes.json());
        setEnergyData(await energyRes.json());
        setRevenueData(await revenueRes.json());
        setInsights(await insightsRes.json());
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const COLORS = ['#00f2ff', '#10b981', '#f59e0b', '#ef4444'];

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Energy" 
          value={`${stats?.totalEnergy || '0'} kWh`} 
          icon={Zap} 
          subtext="Total energy delivered network-wide"
          trend={12.5}
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats?.totalRevenue || '0'}`} 
          icon={DollarSign} 
          subtext="Revenue from charging sessions"
          trend={8.2}
        />
        <StatCard 
          title="Active Sessions" 
          value={stats?.activeSessions || 0} 
          icon={Activity} 
          subtext="Vehicles currently charging"
        />
        <StatCard 
          title="Peak Demand" 
          value={stats?.peakDemand || '--'} 
          icon={Battery} 
          subtext="Highest consumption window"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-brand-blue" />
              Energy Consumption (24h)
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-brand-blue" />
                <span>Consumption</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Solar</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyData}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141417', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="consumption" stroke="#00f2ff" fillOpacity={1} fill="url(#colorConsumption)" />
                <Line type="monotone" dataKey="solar" stroke="#10b981" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-blue" />
            Revenue per Station
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="StationName" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141417', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="revenue" fill="#00f2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Network & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-6 lg:col-span-1">
          <h3 className="text-lg font-bold mb-6">Network Health</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.networkStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="Status"
                >
                  {stats?.networkStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {stats?.networkStatus.map((status, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-gray-400">{status.Status}</span>
                </div>
                <span className="font-bold">{status.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap size={20} className="text-brand-blue" />
              AI Analytics Insights
            </h3>
            <span className="text-xs text-brand-blue uppercase tracking-widest font-bold">Live Analysis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => (
              <div key={insight.id}>
                <InsightCard insight={insight} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStations = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display">Charging Network Map</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">4 Online</span>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">1 Alert</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Simulated Map */}
        <div className="xl:col-span-2 glass-card h-[600px] relative overflow-hidden bg-[#0f0f12]">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#00f2ff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
          </div>
          
          {/* Simulated Map Markers */}
          {stations.map((station) => (
            <div 
              key={station.StationID}
              className="absolute group cursor-pointer"
              style={{ 
                left: `${(station.Lng + 118.27) * 2000}px`, 
                top: `${(34.08 - station.Lat) * 2000}px` 
              }}
            >
              <div className={cn(
                "w-4 h-4 rounded-full neon-glow animate-pulse",
                station.Status === 'Online' ? 'bg-brand-blue' : station.Status === 'Maintenance' ? 'bg-amber-400' : 'bg-rose-500'
              )} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-brand-card border border-brand-blue/30 p-3 rounded-lg shadow-2xl whitespace-nowrap">
                  <p className="font-bold text-sm">{station.StationName}</p>
                  <p className="text-xs text-gray-400">{station.ChargerType} • {station.Status}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-6 right-6 bg-brand-card/90 p-4 rounded-xl border border-white/10 text-xs space-y-2">
            <p className="font-bold uppercase tracking-tighter text-gray-400 mb-2">Map Legend</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue" />
              <span>Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Offline</span>
            </div>
          </div>
        </div>

        {/* Station List */}
        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
          {stations.map((station) => (
            <div key={station.StationID} className="glass-card p-4 hover:border-brand-blue/50 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-brand-blue">{station.StationName}</h4>
                  <p className="text-xs text-gray-500">{station.Location}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                  station.Status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                )}>
                  {station.Status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">Energy Delivered</p>
                  <p className="font-bold">{station.TotalEnergyDelivered.toFixed(1)} kWh</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Charger Type</p>
                  <p className="font-bold">{station.ChargerType}</p>
                </div>
              </div>
              <button className="w-full mt-4 py-2 rounded-lg bg-white/5 text-xs font-medium hover:bg-brand-blue hover:text-brand-dark transition-all flex items-center justify-center gap-2">
                View Details <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-brand-card border-r border-white/10 transition-all duration-300 flex flex-col z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-brand-dark shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <Zap size={24} fill="currentColor" />
          </div>
          {isSidebarOpen && <h1 className="text-xl font-bold font-display tracking-tight">VoltView <span className="text-brand-blue">AI</span></h1>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
              activeTab === 'dashboard' ? "bg-brand-blue text-brand-dark font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <LayoutDashboard size={20} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>
          <button 
            onClick={() => setActiveTab('stations')}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
              activeTab === 'stations' ? "bg-brand-blue text-brand-dark font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <MapIcon size={20} />
            {isSidebarOpen && <span>Station Map</span>}
          </button>
          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <BarChart3 size={20} />
            {isSidebarOpen && <span>Analytics</span>}
          </button>
          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <Settings size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </nav>

        <div className="p-4">
          <div className={cn(
            "rounded-2xl bg-brand-blue/5 border border-brand-blue/20 p-4",
            !isSidebarOpen && "hidden"
          )}>
            <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-2">Scalability</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Managing 5,420+ stations across 12 cities. Cloud-native architecture ready for global expansion.
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full mt-4 p-2 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronRight className="rotate-180" size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-brand-dark relative">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-brand-dark/80 backdrop-blur-md border-bottom border-white/5 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-widest">Network Overview</h2>
            <h1 className="text-2xl font-bold font-display">
              {activeTab === 'dashboard' ? 'Global Dashboard' : 'Station Network'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Sun size={16} className="text-amber-400" />
              <span className="text-xs font-medium">Solar Grid Active: 84%</span>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Harshitha</p>
                <p className="text-[10px] text-brand-blue font-bold uppercase">Network Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-indigo-600 border-2 border-white/10" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' ? renderDashboard() : renderStations()}
          
          <footer className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-600 text-xs">
              VoltView AI &copy; 2026 • Intelligent EV Infrastructure Management • Prototype v1.0.4
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
