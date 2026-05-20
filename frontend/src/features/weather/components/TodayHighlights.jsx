import { Eye, Gauge, Droplets, Thermometer, Sunrise, Sunset } from 'lucide-react';
import { format } from 'date-fns';

const Tile = ({ icon: Icon, label, value, unit, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
    <div className={`inline-flex p-2 rounded-xl ${color} w-fit`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-xl font-extrabold text-gray-900 mt-0.5">
        {value}
        {unit && <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

const TodayHighlights = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const visibility = data.visibility ? `${(data.visibility / 1000).toFixed(1)}` : 'N/A';
  const pressure   = data.main.pressure;
  const humidity   = data.main.humidity;
  const dewPoint   = (data.main.temp - ((100 - data.main.humidity) / 5)).toFixed(1);
  const sunrise    = format(new Date(data.sys.sunrise * 1000), 'h:mm a');
  const sunset     = format(new Date(data.sys.sunset  * 1000), 'h:mm a');

  const tiles = [
    { icon: Eye,         label: 'Visibility',  value: visibility,  unit: 'km',  color: 'bg-sky-50 text-sky-500' },
    { icon: Gauge,       label: 'Pressure',    value: pressure,    unit: 'hPa', color: 'bg-violet-50 text-violet-500' },
    { icon: Droplets,    label: 'Humidity',    value: humidity,    unit: '%',   color: 'bg-blue-50 text-blue-500' },
    { icon: Thermometer, label: 'Dew Point',   value: dewPoint,    unit: '°C',  color: 'bg-teal-50 text-teal-500' },
    { icon: Sunrise,     label: 'Sunrise',     value: sunrise,     unit: '',    color: 'bg-amber-50 text-amber-500' },
    { icon: Sunset,      label: 'Sunset',      value: sunset,      unit: '',    color: 'bg-orange-50 text-orange-500' },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Today's Highlights</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((tile) => (
          <Tile key={tile.label} {...tile} />
        ))}
      </div>
    </div>
  );
};

export default TodayHighlights;
