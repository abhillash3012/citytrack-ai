import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Filter, 
  Search, 
  MapPin, 
  Layers, 
  Crosshair, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Zap,
  Building2
} from 'lucide-react';
import { Project, ProjectType } from '../types';

// Custom Colored Leaflet Marker Icons
const createCustomIcon = (status: string) => {
  let color = '#10b981'; // Green (On Track)
  if (status === 'At Risk') color = '#eab308'; // Yellow
  if (status === 'Delayed') color = '#f97316'; // Orange
  if (status === 'Critical') color = '#ef4444'; // Red
  if (status === 'Completed') color = '#3b82f6'; // Blue

  const svgHtml = `
    <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 38 16 38C16 38 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}"/>
      <circle cx="16" cy="15" r="7" fill="#0f172a"/>
      <circle cx="16" cy="15" r="4" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -34]
  });
};

// Component to dynamically re-center map
const MapCenterController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const CityMap: React.FC = () => {
  const { projects, setSelectedProjectId, setActiveTab } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [mapSearch, setMapSearch] = useState<string>('');
  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite'>('streets');
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.4200, 78.4100]); // Hyderabad Center
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Categories list
  const categoryFilters = [
    { label: 'All Projects', value: 'ALL' },
    { label: 'Roads', value: 'Roads' },
    { label: 'Hospitals', value: 'Hospitals' },
    { label: 'Schools', value: 'Schools' },
    { label: 'Bridges & Flyovers', value: 'Bridges & Flyovers' },
    { label: 'Water Supply', value: 'Water Supply' },
    { label: 'Drainage', value: 'Drainage' },
    { label: 'Public Buildings', value: 'Public Buildings' },
  ];

  // Filter projects by category and map search
  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.projectType === selectedCategory;
    const matchesSearch = !mapSearch.trim() || 
      p.name.toLowerCase().includes(mapSearch.toLowerCase()) ||
      p.location.toLowerCase().includes(mapSearch.toLowerCase()) ||
      p.department.toLowerCase().includes(mapSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleResetLocation = () => {
    setMapCenter([17.4200, 78.4100]);
    setMapZoom(12);
  };

  const tileUrl = tileLayerType === 'streets' 
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  return (
    <div className="space-y-4">
      
      {/* Map Control Bar & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Header Title */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 rounded-xl text-cyan-400 border border-blue-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-white">GIS Infrastructure City Map</h1>
              <p className="text-xs text-slate-400">Spatial visualization of active capital works & delay risks</p>
            </div>
          </div>

          {/* Search & Layer Toggles */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search location or project..."
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={() => setTileLayerType(tileLayerType === 'streets' ? 'satellite' : 'streets')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tileLayerType === 'streets' ? 'Satellite View' : 'Street Map'}</span>
            </button>

            <button
              onClick={handleResetLocation}
              title="Reset Map to Hyderabad Center"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Department / Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categoryFilters.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Map Legend Indicator */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-400 font-semibold text-[11px]">STATUS MAP LEGEND:</span>
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>On Track</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>At Risk</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Delayed</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Critical</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Completed</span>
          </span>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[650px] z-10">
        
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapCenterController center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={tileUrl}
          />

          {filteredProjects.map((project) => (
            <Marker
              key={project.id}
              position={[project.latitude, project.longitude]}
              icon={createCustomIcon(project.status)}
            >
              <Popup>
                <div className="p-1 max-w-xs font-sans text-slate-100">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{project.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'On Track' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      project.status === 'At Risk' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      project.status === 'Delayed' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      project.status === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">{project.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{project.department}</p>
                  <p className="text-xs text-slate-300 mt-1 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Physical Progress</span>
                      <span className="font-bold text-cyan-400">{project.actualProgressPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Budget</span>
                      <span className="font-bold text-white">₹{project.totalBudgetCr} Cr</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target Completion</span>
                      <span className="font-bold text-slate-200 text-[11px]">{project.expectedCompletionDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">AI Delay Probability</span>
                      <span className="font-bold text-rose-400 text-[11px]">{project.aiPrediction.delayProbability}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setActiveTab('projects');
                    }}
                    className="w-full mt-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Inspect Project Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  );
};
