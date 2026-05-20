const useDecisionEngine = (aqi = 1, profileId = 'general') => {
  const getRecommendation = () => {
    switch (aqi) {
      case 1:
        return {
          canGoOutside: 'YES',
          statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeColor: 'bg-emerald-500 text-white',
          duration: 'Unrestricted',
          mask: 'No mask required',
          advice: 'The air quality is perfect. Excellent time for outdoor workouts, a walk in the park, or airing out your home!'
        };
      case 2:
        if (profileId === 'general') {
          return {
            canGoOutside: 'YES',
            statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            badgeColor: 'bg-emerald-500 text-white',
            duration: 'Unrestricted',
            mask: 'No mask required',
            advice: 'Air quality is acceptable. Great day to go outdoors and stay active!'
          };
        } else {
          return {
            canGoOutside: 'YES WITH CAUTION',
            statusColor: 'text-amber-600 bg-amber-50 border-amber-200',
            badgeColor: 'bg-amber-500 text-white',
            duration: 'Up to 2 hours',
            mask: 'Carry a standard mask',
            advice: 'Air is mostly fine, but sensitive groups may experience minor breathing comfort issues. Keep intensity low outdoors.'
          };
        }
      case 3:
        if (profileId === 'general') {
          return {
            canGoOutside: 'YES',
            statusColor: 'text-amber-600 bg-amber-50 border-amber-200',
            badgeColor: 'bg-amber-500 text-white',
            duration: 'Up to 3 hours',
            mask: 'Standard mask optional',
            advice: 'Moderate pollution present. Most healthy people can go out, but consider carrying a mask if you stay long.'
          };
        } else {
          return {
            canGoOutside: 'AVOID / NO',
            statusColor: 'text-orange-600 bg-orange-50 border-orange-200',
            badgeColor: 'bg-orange-500 text-white',
            duration: 'Limit to 30-60 mins',
            mask: 'N95 Respirator recommended',
            advice: 'Unhealthy for sensitive groups. Avoid long outdoor stays. Move physical exercises indoors today.'
          };
        }
      case 4:
        if (profileId === 'general') {
          return {
            canGoOutside: 'AVOID / NO',
            statusColor: 'text-red-600 bg-red-50 border-red-200',
            badgeColor: 'bg-red-500 text-white',
            duration: 'Limit to 30-45 mins',
            mask: 'N95 Respirator highly recommended',
            advice: 'Pollution levels are high. Healthy individuals should limit outdoor exposure and wear a mask.'
          };
        } else {
          return {
            canGoOutside: 'STRICT NO',
            statusColor: 'text-rose-700 bg-rose-50 border-rose-200',
            badgeColor: 'bg-rose-600 text-white',
            duration: 'Avoid outdoors (Limit to 10 mins)',
            mask: 'N95 Respirator mandatory',
            advice: 'Highly unhealthy for sensitive individuals. Stay indoors with doors/windows closed. Use air purifiers if possible.'
          };
        }
      case 5:
      default:
        return {
          canGoOutside: 'STRICT NO',
          statusColor: 'text-purple-700 bg-purple-50 border-purple-200',
          badgeColor: 'bg-purple-600 text-white',
          duration: 'Stay indoors',
          mask: 'N95 Respirator mandatory if going out',
          advice: 'Hazardous air quality for everyone! Stay indoors as much as possible. Keep all windows and doors closed tightly.'
        };
    }
  };

  return getRecommendation();
};

export default useDecisionEngine;
