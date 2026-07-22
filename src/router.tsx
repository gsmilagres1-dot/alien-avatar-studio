import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export interface AuthState {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  userId: string | null;
  email: string | null;
  loading: boolean;
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      auth: { isAuthenticated: false, isAnonymous: false, userId: null, email: null, loading: true } as AuthState,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
