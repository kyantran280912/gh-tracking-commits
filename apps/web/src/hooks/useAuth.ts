"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { User } from "@repo/shared";

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isHydrated: false,

            setHydrated: () => set({ isHydrated: true }),

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await apiClient.login({ email, password });
                    const token = response.data?.token || null;

                    // Store token in both ApiClient and Zustand state
                    apiClient.setToken(token);

                    set({
                        user: response.data?.user || null,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (email: string, username: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await apiClient.register({ email, username, password });
                    const token = response.data?.token || null;

                    // Store token in both ApiClient and Zustand state
                    apiClient.setToken(token);

                    set({
                        user: response.data?.user || null,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await apiClient.logout();
                } catch {
                    // Ignore API errors during logout
                } finally {
                    // Always clear local state
                    apiClient.setToken(null);
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            },

            fetchUser: async () => {
                const { token } = get();

                // No token means not authenticated
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false });
                    return;
                }

                set({ isLoading: true });
                try {
                    const response = await apiClient.getCurrentUser();
                    set({
                        user: response.data || null,
                        isAuthenticated: !!response.data,
                        isLoading: false,
                    });
                } catch (error: unknown) {
                    // Only logout for auth errors (401, 403)
                    const status = (error as { status?: number })?.status;
                    if (status === 401 || status === 403) {
                        apiClient.setToken(null);
                        set({
                            user: null,
                            token: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    } else {
                        // Network error - keep user logged in, just stop loading
                        set({ isLoading: false });
                    }
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Sync token with ApiClient after hydration
                if (state?.token) {
                    apiClient.setToken(state.token);
                }
                // Mark as hydrated
                state?.setHydrated();
            },
        }
    )
);
