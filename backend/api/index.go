package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/internal/clients"
	"github.com/restorefine/agencyos/internal/content"
	"github.com/restorefine/agencyos/internal/contracts"
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
	"github.com/restorefine/agencyos/pkg/stream"
)

var (
	once       sync.Once
	appHandler http.Handler
)

// Handler is the Vercel serverless entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	appHandler.ServeHTTP(w, r)
}

func initApp() {
	godotenv.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := appdb.NewPool(ctx)
	if err != nil {
		log.Fatalf("[FATAL] db connect: %v", err)
	}

	m := mailer.New()
	hub := stream.NewHub()

	authSvc := auth.NewService(pool)
	authHandler := auth.NewHandler(authSvc, pool)

	usersRepo := users.NewRepository(pool)
	usersSvc := users.NewService(usersRepo)
	usersHandler := users.NewHandler(usersSvc)

	clientsRepo := clients.NewRepository(pool)
	clientsSvc := clients.NewService(clientsRepo, usersRepo)
	clientsHandler := clients.NewHandler(clientsSvc, m, hub)

	invoicesRepo := invoices.NewRepository(pool)
	invoicesSvc := invoices.NewService(invoicesRepo)
	invoicesHandler := invoices.NewHandler(invoicesSvc)

	pipelineRepo := pipeline.NewRepository(pool)
	pipelineSvc := pipeline.NewService(pipelineRepo)
	pipelineHandler := pipeline.NewHandler(pipelineSvc)

	contentRepo := content.NewRepository(pool)
	contentSvc := content.NewService(contentRepo)
	contentHandler := content.NewHandler(contentSvc)

	videosRepo := videos.NewRepository(pool)
	videosSvc := videos.NewService(videosRepo)
	videosHandler := videos.NewHandler(videosSvc)

	vchatRepo := videochat.NewRepository(pool)
	vchatHandler := videochat.NewHandler(vchatRepo, hub, pool)

	onboardingRepo := onboarding.NewRepository(pool)
	onboardingSvc := onboarding.NewService(onboardingRepo)
	onboardingHandler := onboarding.NewHandler(onboardingSvc)

	quotesRepo := quotes.NewRepository(pool)
	quotesSvc := quotes.NewService(quotesRepo)
	quotesHandler := quotes.NewHandler(quotesSvc)

	contractsRepo := contracts.NewRepository(pool)
	contractsSvc := contracts.NewService(contractsRepo)
	contractsHandler := contracts.NewHandler(contractsSvc)

	dashboardSvc := dashboard.NewService(pool)
	dashboardHandler := dashboard.NewHandler(dashboardSvc)

	portalSvc := portal.NewService(pool)
	portalHandler := portal.NewHandler(portalSvc)

	streamHandler := stream.NewHandler(hub)

	if err := usersSvc.SeedAdminUsers(context.Background()); err != nil {
		log.Printf("[WARN] seed users: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{os.Getenv("FRONTEND_URL"), "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(ratelimit.GlobalLimiter().Middleware)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	loginLimiter := ratelimit.LoginLimiter()
	r.Group(func(r chi.Router) {
		r.Use(loginLimiter.Middleware)
		r.Post("/api/auth/login", authHandler.Login)
	})
	r.Post("/api/auth/refresh", authHandler.Refresh)
	r.Post("/api/auth/logout", authHandler.Logout)
	r.Get("/api/contracts/public/{token}", contractsHandler.GetPublicContract)
	r.Post("/api/contracts/public/{token}/sign", contractsHandler.SignContract)

	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Get("/api/auth/me", authHandler.Me)
		r.Post("/api/auth/change-password", authHandler.ChangePassword)
		r.Get("/api/stream", streamHandler.Stream)

		r.Route("/api/users", func(r chi.Router) {
			r.Use(auth.RequireRole("admin"))
			r.Get("/", usersHandler.List)
			r.Post("/", usersHandler.Create)
			r.Patch("/{id}", usersHandler.Update)
			r.Delete("/{id}", usersHandler.Delete)
		})

		r.Route("/api/clients", func(r chi.Router) {
			r.Get("/", clientsHandler.List)
			r.Post("/", appendMW(auth.RequireRole("admin"), clientsHandler.Create))
			r.Get("/{id}", clientsHandler.GetByID)
			r.Patch("/{id}", clientsHandler.Update)
			r.Delete("/{id}", appendMW(auth.RequireRole("admin"), clientsHandler.Delete))
			r.Post("/{id}/activate-portal", appendMW(auth.RequireRole("admin"), clientsHandler.ActivatePortal))
		})

		r.Route("/api/invoices", func(r chi.Router) {
			r.Get("/", invoicesHandler.List)
			r.Post("/", invoicesHandler.Create)
			r.Patch("/{id}/mark-paid", invoicesHandler.MarkPaid)
			r.Delete("/{id}", invoicesHandler.Delete)
		})

		r.Route("/api/pipeline", func(r chi.Router) {
			r.Get("/", pipelineHandler.List)
			r.Post("/", pipelineHandler.Create)
			r.Get("/{id}", pipelineHandler.GetByID)
			r.Patch("/{id}", pipelineHandler.Update)
			r.Patch("/{id}/move", pipelineHandler.Move)
			r.Delete("/{id}", pipelineHandler.Delete)
		})

		r.Route("/api/content", func(r chi.Router) {
			r.Get("/", contentHandler.List)
			r.Post("/", contentHandler.Create)
			r.Patch("/{id}", contentHandler.Update)
			r.Delete("/{id}", contentHandler.Delete)
		})

		r.Route("/api/videos", func(r chi.Router) {
			r.Get("/", videosHandler.List)
			r.Post("/", videosHandler.Create)
			r.Patch("/{id}", videosHandler.Update)
			r.Patch("/{id}/approve", videosHandler.Approve)
			r.Patch("/{id}/request-edit", videosHandler.RequestEdit)
			r.Delete("/{id}", videosHandler.Delete)
			r.Get("/{id}/comments", videosHandler.ListComments)
			r.Post("/{id}/comments", videosHandler.AddComment)
			r.Get("/{id}/chat", vchatHandler.List)
			r.Post("/{id}/chat", vchatHandler.Send)
			r.Post("/{id}/chat/typing", vchatHandler.Typing)
		})

		r.Route("/api/onboarding", func(r chi.Router) {
			r.Get("/all", onboardingHandler.GetAll)
			r.Get("/{clientId}", onboardingHandler.GetByClient)
			r.Patch("/{clientId}/step/{stepId}", onboardingHandler.ToggleStep)
		})

		r.Route("/api/quotes", func(r chi.Router) {
			r.Get("/", quotesHandler.List)
			r.Post("/", quotesHandler.Create)
			r.Delete("/{id}", quotesHandler.Delete)
		})

		r.Route("/api/contracts", func(r chi.Router) {
			r.Get("/", contractsHandler.List)
			r.Post("/", contractsHandler.Create)
			r.Post("/share", contractsHandler.ShareContract)
			r.Get("/links", contractsHandler.ListLinks)
			r.Delete("/links/{id}", contractsHandler.DeleteLink)
			r.Delete("/{id}", contractsHandler.Delete)
		})

		r.Get("/api/dashboard", dashboardHandler.GetStats)

		r.Route("/api/portal", func(r chi.Router) {
			r.Use(auth.RequireRole("client"))
			r.Get("/me", portalHandler.GetMe)
			r.Get("/invoices", portalHandler.GetInvoices)
			r.Get("/videos", portalHandler.GetVideos)
			r.Patch("/videos/{id}/approve", portalHandler.ApproveVideo)
			r.Get("/content", portalHandler.GetContent)
		})
	})

	appHandler = r
}

func appendMW(mw func(http.Handler) http.Handler, h http.HandlerFunc) http.HandlerFunc {
	return mw(h).ServeHTTP
}
