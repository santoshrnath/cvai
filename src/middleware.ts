import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public surface — everything else routes through Clerk's auth handlers and
// can be inspected via auth() inside the route. We deliberately do NOT block
// the landing/upload/candidates pages so visitors can see the UI without
// logging in.
//
// The cost-bearing API routes (upload, search, interview-kit) enforce
// auth() inside the handler and return 401 if the visitor isn't signed in.
const isPublicRoute = createRouteMatcher([
  "/",
  "/upload",
  "/candidates",
  "/candidates/(.*)",
  "/api/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files; always include API routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
