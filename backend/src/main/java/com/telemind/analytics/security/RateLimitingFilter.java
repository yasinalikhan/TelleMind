package com.telemind.analytics.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, TokenBucket> limiters = new ConcurrentHashMap<>();
    private final int MAX_TOKENS = 100; // max requests
    private final long REFILL_TIME_MS = 60000; // 1 minute

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Exclude h2-console or login endpoints if needed, but rate limiting them is fine too.
        String path = request.getRequestURI();
        if (path.contains("/h2-console")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = request.getRemoteAddr();
        TokenBucket bucket = limiters.computeIfAbsent(ip, k -> new TokenBucket(MAX_TOKENS, REFILL_TIME_MS));

        if (bucket.tryConsume()) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests. Limit is 100 requests per minute.\"}");
        }
    }

    private static class TokenBucket {
        private final int maxTokens;
        private final long refillTimeMs;
        private int tokens;
        private long lastRefillTimestamp;

        public TokenBucket(int maxTokens, long refillTimeMs) {
            this.maxTokens = maxTokens;
            this.refillTimeMs = refillTimeMs;
            this.tokens = maxTokens;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTimestamp;
            if (elapsed > refillTimeMs) {
                tokens = maxTokens;
                lastRefillTimestamp = now;
            } else {
                int refillAmount = (int) (maxTokens * (double) elapsed / refillTimeMs);
                if (refillAmount > 0) {
                    tokens = Math.min(maxTokens, tokens + refillAmount);
                    lastRefillTimestamp = now;
                }
            }
        }
    }
}
