import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { supabase } from '@/integrations/supabase/client';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const africanCountryCodes = [
  '012','024','072','108','120','132','140','148','174','178','180','188',
  '204','226','231','232','266','270','288','324','384','404','426','430',
  '434','450','454','466','478','480','504','508','516','562','566','624',
  '638','646','654','678','686','694','706','710','716','728','729','732',
  '748','768','788','800','834','854','894',
];

const AfricaMap = () => {
  const [countryData, setCountryData] = useState<Record<string, number>>({});
  const [tooltip, setTooltip] = useState({ show: false, name: '', users: 0, x: 0, y: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('country_distribution').select('*');
      if (data) {
        const map: Record<string, number> = {};
        (data as any[]).forEach((d) => { map[d.country] = d.users; });
        setCountryData(map);
      }
    };
    fetch();
  }, []);

  const maxUsers = Math.max(...Object.values(countryData), 1);

  const getColor = (name: string) => {
    const users = countryData[name] || 0;
    if (users === 0) return 'hsl(var(--border))';
    const intensity = Math.min(users / maxUsers, 1);
    return `hsl(145, 83%, ${70 - intensity * 40}%)`;
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">Africa Signup Map</h2>
      <div className="relative" style={{ maxHeight: 400 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [20, 5], scale: 350 }}
          style={{ width: '100%', height: 'auto', maxHeight: 400 }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => africanCountryCodes.includes(geo.id))
                  .map((geo) => {
                    const name = geo.properties.name;
                    const users = countryData[name] || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getColor(name)}
                        stroke="hsl(var(--background))"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: 'hsl(var(--primary))' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={(e) => {
                          setTooltip({ show: true, name, users, x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                      />
                    );
                  })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        {tooltip.show && (
          <div
            className="fixed z-50 bg-secondary text-secondary-foreground font-body text-xs rounded-lg px-3 py-2 pointer-events-none"
            style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
          >
            {tooltip.name}: {tooltip.users} signups
          </div>
        )}
      </div>
    </div>
  );
};

export default AfricaMap;
