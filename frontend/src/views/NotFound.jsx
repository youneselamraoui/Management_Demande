import { Link, useRouteError } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center p-8 text-center">
      <div>
        <h1 className="text-4xl font-extrabold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export function RouteError() {
  const err = useRouteError();
  return (
    <div className="grid min-h-[50vh] place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold text-destructive">An error occurred</h1>
        <p className="mt-2 text-sm text-muted-foreground">{err?.statusText || err?.message || "Unexpected error"}</p>
        <Link to="/" className="mt-6 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          Go back
        </Link>
      </div>
    </div>
  );
}
