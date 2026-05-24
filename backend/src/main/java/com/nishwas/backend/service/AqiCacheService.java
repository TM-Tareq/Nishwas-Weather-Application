package com.nishwas.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Background service: every 30 minutes fetches AQI for 10 BD cities
 * from OpenWeatherMap using a pooled RestTemplate (multi-threaded),
 * caches results in a ConcurrentHashMap, and pushes live updates
 * to all WebSocket subscribers on /topic/aqi.
 */
@Service
@RequiredArgsConstructor
public class AqiCacheService {

    private final RestTemplate restTemplate;
    private final SimpMessagingTemplate messaging;

    @Value("${OWM_API_KEY:69c48fd3866fe256fb85aff609f089e0}")
    private String owmApiKey;

    // Thread-safe city → AQI level (1–5) cache
    private final Map<String, Integer> cache = new ConcurrentHashMap<>();

    // 10 Bangladesh cities: name → {lat, lon}
    private static final Map<String, double[]> BD_CITIES;
    static {
        Map<String, double[]> m = new LinkedHashMap<>();
        m.put("Dhaka",       new double[]{23.8103, 90.4125});
        m.put("Chittagong",  new double[]{22.3569, 91.7832});
        m.put("Sylhet",      new double[]{24.8949, 91.8687});
        m.put("Rajshahi",    new double[]{24.3745, 88.6042});
        m.put("Khulna",      new double[]{22.8456, 89.5403});
        m.put("Barishal",    new double[]{22.7010, 90.3535});
        m.put("Mymensingh",  new double[]{24.7471, 90.4203});
        m.put("Rangpur",     new double[]{25.7439, 89.2752});
        m.put("Comilla",     new double[]{23.4607, 91.1809});
        m.put("Narayanganj", new double[]{23.6238, 90.4997});
        BD_CITIES = Collections.unmodifiableMap(m);
    }

    @PostConstruct
    public void init() {
        // Warm-up cache immediately on startup
        fetchAndBroadcast();
    }

    // Runs every 30 minutes after the previous run completes
    @Scheduled(fixedDelay = 1_800_000)
    public void fetchAndBroadcast() {
        if (owmApiKey.isBlank()) return;

        // Each city is fetched sequentially here;
        // the scheduler itself runs on a separate dedicated thread (not the main thread).
        BD_CITIES.forEach((city, coords) -> {
            try {
                String url = String.format(
                    "http://api.openweathermap.org/data/2.5/air_pollution?lat=%.4f&lon=%.4f&appid=%s",
                    coords[0], coords[1], owmApiKey
                );
                Map<?, ?> body = restTemplate.getForObject(url, Map.class);
                if (body == null) return;

                List<?> list = (List<?>) body.get("list");
                if (list == null || list.isEmpty()) return;

                Map<?, ?> first = (Map<?, ?>) list.get(0);
                Map<?, ?> main  = (Map<?, ?>) first.get("main");
                if (main == null) return;

                cache.put(city, ((Number) main.get("aqi")).intValue());
            } catch (Exception ignored) {
                // Per-city failure: skip, keep stale value
            }
        });

        if (!cache.isEmpty()) {
            // Broadcast fresh AQI data to all connected WebSocket clients
            messaging.convertAndSend("/topic/aqi", cache);
        }
    }

    public Map<String, Integer> getCache() {
        return Collections.unmodifiableMap(cache);
    }
}
