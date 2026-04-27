package ratelimit

import (
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	r        rate.Limit
	b        int
}

func New(r rate.Limit, b int) *IPLimiter {
	il := &IPLimiter{
		visitors: make(map[string]*visitor),
		r:        r,
		b:        b,
	}
	go il.cleanupVisitors()
	return il
}

func (il *IPLimiter) getVisitor(ip string) *rate.Limiter {
	il.mu.Lock()
	defer il.mu.Unlock()
	v, exists := il.visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(il.r, il.b)
		il.visitors[ip] = &visitor{limiter, time.Now()}
		return limiter
	}
	v.lastSeen = time.Now()
	return v.limiter
}

func (il *IPLimiter) cleanupVisitors() {
	for {
		time.Sleep(time.Minute)
		il.mu.Lock()
		for ip, v := range il.visitors {
			if time.Since(v.lastSeen) > 3*time.Minute {
				delete(il.visitors, ip)
			}
		}
		il.mu.Unlock()
	}
}

func (il *IPLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			ip = xff
		}
		limiter := il.getVisitor(ip)
		if !limiter.Allow() {
			http.Error(w, `{"error":"rate limit exceeded","code":"RATE_LIMIT"}`, http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Global: 200/min
func GlobalLimiter() *IPLimiter {
	return New(rate.Every(time.Minute/200), 200)
}

// Login: 5/min
func LoginLimiter() *IPLimiter {
	return New(rate.Every(time.Minute/5), 5)
}
