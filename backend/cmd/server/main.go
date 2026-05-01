package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/internal/clients"
	"github.com/restorefine/agencyos/internal/contracts"
	"github.com/restorefine/agencyos/internal/content"
	"github.com/restorefine/agencyos/internal/dashboard"
	"github.com/restorefine/agencyos/internal/invoices"
	"github.com/restorefine/agencyos/internal/onboarding"
	"github.com/restorefine/agencyos/internal/pipeline"
	"github.com/restorefine/agencyos/internal/portal"
	"github.com/restorefine/agencyos/internal/quotes"
	"github.com/restorefine/agencyos/internal/users"
	"github.com/restorefine/agencyos/internal/videochat"
	"github.com/restorefine/agencyos/internal/videos"
	appdb "github.com/restorefine/agencyos/pkg/db"
	"github.com/restorefine/agencyos/pkg/mailer"
	"github.com/restorefine/agencyos/pkg/ratelimit"
	"github.com/restorefine/agencyos/pkg/scheduler"
	"github.com/restorefine/agencyos/pkg/stream"
)

func main() {
	// 1. Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] no .env file found, using environment variables")
	}

	// 2. Connect DB pool
	ctx := context.Background()
	pool, err := appdb.NewPool(ctx)
	if err != nil {
		log.Fatalf("[FATAL] db connect: %v", err)
	}
	defer pool.Close()
	log.Println("[INFO] database connected")

	// 3. Run goose migrations
	migrationDSN := os.Getenv("DIRECT_URL")
	if migrationDSN == "" {
		migrationDSN = os.Getenv("DATABASE_URL")
	}
	if migrationDSN != "" {
		sqlDB, err := sql.Open("pgx", migrationDSN)
		if err != nil {
			log.Fatalf("[FATAL] open migration db: %v", err)
		}
		// Resolve migrations dir relative to binary working directory
		migrationsDir := os.Getenv("MIGRATIONS_DIR")
		if migrationsDir == "" {
			migrationsDir = "migrations"
		}
		if err := goose.SetDialect("postgres"); err != nil {
			log.Fatalf("[FATAL] goose dialect: %v", err)
		}
		if err := goose.Up(sqlDB, migrationsDir); err != nil {
			log.Fatalf("[FATAL] migrations: %v", err)
		}
		sqlDB.Close()
		log.Println("[INFO] migrations applied")
	}

	// 4. Create all repositories, services, handlers
	m := mailer.New()
	hub := stream.NewHub()

	// Auth
	authSvc := auth.NewService(pool)
	authHandler := auth.NewHandler(authSvc, pool)

	// Users
	usersRepo := users.NewRepository(pool)
	usersSvc := users.NewService(usersRepo)
	usersHandler := users.NewHandler(usersSvc)

	// Clients
	clientsRepo := clients.NewRepository(pool)
	clientsSvc := clients.NewService(clientsRepo, usersRepo)
	clientsHandler := clients.NewHandler(clientsSvc, m, hub)

	// Invoices
	invoicesRepo := invoices.NewRepository(pool)
	invoicesSvc := invoices.NewService(invoicesRepo)
	invoicesHandler := invoices.NewHandler(invoicesSvc)

	// Pipeline
	pipelineRepo := pipeline.NewRepository(pool)
	pipelineSvc := pipeline.NewService(pipelineRepo)
	pipelineHandler := pipeline.NewHandler(pipelineSvc)

	// Content
	contentRepo := content.NewRepository(pool)
	contentSvc := content.NewService(contentRepo)
	contentHandler := content.NewHandler(contentSvc)

	// Videos
	videosRepo := videos.NewRepository(pool)
	videosSvc := videos.NewService(videosRepo)
	videosHandler := videos.NewHandler(videosSvc)

	// Video Chat
	vchatRepo := videochat.NewRepository(pool)
	vchatHandler := videochat.NewHandler(vchatRepo, hub, pool)

	// Onboarding
	onboardingRepo := onboarding.NewRepository(pool)
	onboardingSvc := onboarding.NewService(onboardingRepo)
	onboardingHandler := onboarding.NewHandler(onboardingSvc)

	// Quotes
	quotesRepo := quotes.NewRepository(pool)
	quotesSvc := quotes.NewService(quotesRepo)
	quotesHandler := quotes.NewHandler(quotesSvc)

	// Contracts
	contractsRepo := contracts.NewRepository(pool)
	contractsSvc := contracts.NewService(contractsRepo)
	contractsHandler := contracts.NewHandler(contractsSvc)

	// Dashboard
	dashboardSvc := dashboard.NewService(pool)
	dashboardHandler := dashboard.NewHandler(dashboardSvc)

	// Portal
	portalSvc := portal.NewService(pool)
	portalHandler := portal.NewHandler(portalSvc)

	// Stream handler
	streamHandler := stream.NewHandler(hub)

	// 5. Seed users if DB is empty
	if err := usersSvc.SeedAdminUsers(ctx); err != nil {
		log.Printf("[WARN] seed users: %v", err)
	}

	// 6. Setup chi router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	allowedOrigins := []string{"http://localhost:3000"}
	if allowedOrigin := os.Getenv("ALLOWED_ORIGIN"); allowedOrigin != "" {
		allowedOrigins = append(allowedOrigins, allowedOrigin)
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(ratelimit.GlobalLimiter().Middleware)

	// Health
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// Auth routes (public)
	loginLimiter := ratelimit.LoginLimiter()
	r.Group(func(r chi.Router) {
		r.Use(loginLimiter.Middleware)
		r.Post("/api/auth/login", authHandler.Login)
	})
	r.Post("/api/auth/refresh", authHandler.Refresh)
	r.Post("/api/auth/logout", authHandler.Logout)

	// Contract signing — public (no auth)
	r.Get("/api/contracts/public/{token}", contractsHandler.GetPublicContract)
	r.Post("/api/contracts/public/{token}/sign", contractsHandler.SignContract)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		// Auth: me + change password
		r.Get("/api/auth/me", authHandler.Me)
		r.Post("/api/auth/change-password", authHandler.ChangePassword)

		// SSE stream
		r.Get("/api/stream", streamHandler.Stream)

		// Users (admin only)
		r.Route("/api/users", func(r chi.Router) {
			r.Use(auth.RequireRole("admin"))
			r.Get("/", usersHandler.List)
			r.Post("/", usersHandler.Create)
			r.Patch("/{id}", usersHandler.Update)
			r.Delete("/{id}", usersHandler.Delete)
		})

		// Clients
		r.Route("/api/clients", func(r chi.Router) {
			r.Get("/", clientsHandler.List)
			r.Post("/", appendMiddleware(auth.RequireRole("admin"), clientsHandler.Create))
			r.Get("/{id}", clientsHandler.GetByID)
			r.Patch("/{id}", clientsHandler.Update)
			r.Delete("/{id}", appendMiddleware(auth.RequireRole("admin"), clientsHandler.Delete))
			r.Post("/{id}/activate-portal", appendMiddleware(auth.RequireRole("admin"), clientsHandler.ActivatePortal))
		})

		// Invoices
		r.Route("/api/invoices", func(r chi.Router) {
			r.Get("/", invoicesHandler.List)
			r.Post("/", invoicesHandler.Create)
			r.Patch("/{id}/mark-paid", invoicesHandler.MarkPaid)
			r.Delete("/{id}", invoicesHandler.Delete)
		})

		// Pipeline
		r.Route("/api/pipeline", func(r chi.Router) {
			r.Get("/", pipelineHandler.List)
			r.Post("/", pipelineHandler.Create)
			r.Get("/{id}", pipelineHandler.GetByID)
			r.Patch("/{id}", pipelineHandler.Update)
			r.Patch("/{id}/move", pipelineHandler.Move)
			r.Delete("/{id}", pipelineHandler.Delete)
		})

		// Content
		r.Route("/api/content", func(r chi.Router) {
			r.Get("/", contentHandler.List)
			r.Post("/", contentHandler.Create)
			r.Patch("/{id}", contentHandler.Update)
			r.Delete("/{id}", contentHandler.Delete)
		})

		// Videos
		r.Route("/api/videos", func(r chi.Router) {
			r.Get("/", videosHandler.List)
			r.Post("/", videosHandler.Create)
			r.Patch("/{id}", videosHandler.Update)
			r.Patch("/{id}/approve", videosHandler.Approve)
			r.Patch("/{id}/request-edit", videosHandler.RequestEdit)
			r.Delete("/{id}", videosHandler.Delete)
			r.Get("/{id}/comments", videosHandler.ListComments)
			r.Post("/{id}/comments", videosHandler.AddComment)
			// Chat — registered inside the same Route block so chi matches correctly
			r.Get("/{id}/chat", vchatHandler.List)
			r.Post("/{id}/chat", vchatHandler.Send)
			r.Post("/{id}/chat/typing", vchatHandler.Typing)
		})

		// Onboarding
		r.Route("/api/onboarding", func(r chi.Router) {
			r.Get("/all", onboardingHandler.GetAll)
			r.Get("/{clientId}", onboardingHandler.GetByClient)
			r.Patch("/{clientId}/step/{stepId}", onboardingHandler.ToggleStep)
		})

		// Quotes
		r.Route("/api/quotes", func(r chi.Router) {
			r.Get("/", quotesHandler.List)
			r.Post("/", quotesHandler.Create)
			r.Delete("/{id}", quotesHandler.Delete)
		})

		// Contracts
		r.Route("/api/contracts", func(r chi.Router) {
			r.Get("/", contractsHandler.List)
			r.Post("/", contractsHandler.Create)
			// Static sub-paths must be registered before /{id} wildcard
			r.Post("/share", contractsHandler.ShareContract)
			r.Get("/links", contractsHandler.ListLinks)
			r.Delete("/links/{id}", contractsHandler.DeleteLink)
			// Wildcard last
			r.Delete("/{id}", contractsHandler.Delete)
		})

		// Dashboard
		r.Get("/api/dashboard", dashboardHandler.GetStats)

		// Portal (client role only)
		r.Route("/api/portal", func(r chi.Router) {
			r.Use(auth.RequireRole("client"))
			r.Get("/me", portalHandler.GetMe)
			r.Get("/invoices", portalHandler.GetInvoices)
			r.Get("/videos", portalHandler.GetVideos)
			r.Patch("/videos/{id}/approve", portalHandler.ApproveVideo)
			r.Get("/content", portalHandler.GetContent)
		})
	})

	// 9. Start scheduler goroutine
	sched := scheduler.New(pool, m)
	go sched.Start()

	// 10. Listen on PORT
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Printf("[INFO] starting server on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("[FATAL] server: %v", err)
	}
}

// appendMiddleware wraps a handler with a single middleware inline.
func appendMiddleware(mw func(http.Handler) http.Handler, h http.HandlerFunc) http.HandlerFunc {
	return mw(h).ServeHTTP
}
