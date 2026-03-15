import { useEffect, useRef } from 'react';
import { Hospital } from '../../types';
import { getHospitalSnapshot } from '../../services/hospitalService';

interface Props {
  hospitals: Hospital[];
  selectedId?: string;
  originLat?: number;
  originLng?: number;
  onSelect?: (id: string) => void;
  height?: string;
}

export function HospitalMap({ hospitals, selectedId, originLat, originLng, onSelect, height = '400px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {

      // Fix default icon path issues with Vite
      // @ts-ignore
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.default.map(mapRef.current!, {
        center: [-25.4296, -49.2719],
        zoom: 12,
        zoomControl: true,
      });

      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = { map, L: L.default };

      // Add hospital markers
      const newMarkers: any[] = [];
      hospitals.forEach(h => {
        const isSelected = h.id === selectedId;
        const isUPA = h.type === 'upa';
        const snapshot = getHospitalSnapshot(h);

        const iconHtml = `
          <div style="
            width: ${isSelected ? 40 : isUPA ? 28 : 32}px;
            height: ${isSelected ? 40 : isUPA ? 28 : 32}px;
            background: ${isSelected ? '#22C55E' : isUPA ? '#F97316' : '#3B82F6'};
            border: 2px solid ${isSelected ? '#16A34A' : isUPA ? '#EA580C' : '#2563EB'};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: ${isUPA ? '11px' : '13px'};
            font-weight: bold;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            cursor: pointer;
            transition: all 0.2s;
          ">
            ${isUPA ? 'U' : 'H'}
          </div>
        `;

        const icon = L.default.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [isUPA ? 28 : 32, isUPA ? 28 : 32],
          iconAnchor: [isUPA ? 14 : 16, isUPA ? 14 : 16],
        });

        const marker = L.default.marker([h.lat, h.lng], { icon }).addTo(map);

        const occupancyColor = { baixa: '#10B981', media: '#3B82F6', alta: '#F59E0B', critica: '#EF4444' }[snapshot.occupancy];
        const occupancyLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' }[snapshot.occupancy];

        marker.bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 200px;">
            <div style="font-weight: 700; color: #F1F5F9; font-size: 13px; margin-bottom: 4px;">${h.shortName}</div>
            <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">${h.address}, ${h.neighborhood}</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <span style="background: ${occupancyColor}22; color: ${occupancyColor}; border: 1px solid ${occupancyColor}44; border-radius: 4px; padding: 1px 6px; font-size: 10px;">
                Lotação: ${occupancyLabel} (${snapshot.occupancyPercent}%)
              </span>
              <span style="background: #3B82F622; color: #93C5FD; border: 1px solid #3B82F644; border-radius: 4px; padding: 1px 6px; font-size: 10px;">
                ${h.icuBeds > 0 ? `${h.icuBeds} leitos UTI` : 'Sem UTI'}
              </span>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #CBD5E1;">${snapshot.statusLabel} · ${snapshot.availableBeds} leitos livres</div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748B;">CNES: ${h.cnes}</div>
          </div>
        `, {
          className: 'sireme-popup',
        });

        marker.on('click', () => onSelect?.(h.id));
        newMarkers.push({ id: h.id, marker });
      });

      markersRef.current = newMarkers;

      // Origin marker
      if (originLat !== undefined && originLng !== undefined) {
        const originIcon = L.default.divIcon({
          html: `<div style="width:16px;height:16px;background:#F59E0B;border:2px solid #D97706;border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.2)"></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.default.marker([originLat, originLng], { icon: originIcon })
          .addTo(map)
          .bindPopup('<div style="font-family: DM Sans, sans-serif; color: #F1F5F9; font-size: 12px;">📍 Origem do caso</div>');

        // Draw radius circle
        L.default.circle([originLat, originLng], {
          radius: 8000,
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.03,
          weight: 1,
          dashArray: '4 4',
          opacity: 0.3,
        }).addTo(map);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Pan to selected
    const found = hospitals.find(h => h.id === selectedId);
    if (found) {
      mapInstanceRef.current.map.panTo([found.lat, found.lng], { animate: true });
    }
  }, [selectedId, hospitals]);

  return (
    <>
      <style>{`
        .sireme-popup .leaflet-popup-content-wrapper {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .sireme-popup .leaflet-popup-tip { background: #1E293B; }
        .leaflet-container { font-family: 'DM Sans', sans-serif; background: #060B14; }
      `}</style>
      <div className="relative">
        <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
        <div className="absolute left-3 bottom-3 z-[400] rounded-lg border border-slate-700/70 bg-slate-950/85 px-3 py-2 text-[10px] text-slate-300 backdrop-blur">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Hospitais</div>
          <div className="flex items-center gap-2 mt-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> UPAs</div>
          {originLat !== undefined && originLng !== undefined && (
            <div className="flex items-center gap-2 mt-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Origem do caso</div>
          )}
        </div>
      </div>
    </>
  );
}
