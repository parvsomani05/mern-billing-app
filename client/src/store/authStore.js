import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', credentials)

          if (response.data.success) {
            const { token, user } = response.data

            // Store token and user data in localStorage for direct API calls
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false
            })

            // Set token in API headers
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            return { success: true, user }
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', userData)

          if (response.data.success) {
            const { token, user } = response.data

            // Store token and user data in localStorage for direct API calls
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false
            })

            // Set token in API headers
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            return { success: true, user }
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await api.get('/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear localStorage
          localStorage.removeItem('token')
          localStorage.removeItem('user')

          // Clear state regardless of API call result
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })

          // Remove token from API headers
          delete api.defaults.headers.common['Authorization']
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await api.put('/auth/updatedetails', userData)

          if (response.data.success) {
            const updatedUser = response.data.data

            // Update localStorage with new user data
            localStorage.setItem('user', JSON.stringify(updatedUser))

            set({
              user: updatedUser,
              isLoading: false
            })
            return { success: true, user: updatedUser }
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      updatePassword: async (passwordData) => {
        set({ isLoading: true })
        try {
          const response = await api.put('/auth/updatepassword', passwordData)

          if (response.data.success) {
            set({ isLoading: false })
            return { success: true }
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Initialize auth state from stored token
      initializeAuth: async () => {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          set({ isLoading: true })

          try {
            // Set token in API headers
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`

            // Get current user to verify token is still valid
            const response = await api.get('/auth/me')

            if (response.data.success) {
              const currentUser = response.data.data
              // Update stored user data with fresh data from server
              localStorage.setItem('user', JSON.stringify(currentUser))

              set({
                user: currentUser,
                token: storedToken,
                isAuthenticated: true,
                isLoading: false
              })
            } else {
              throw new Error('Invalid token')
            }
          } catch (error) {
            console.error('Auth initialization error:', error)

            // Clear invalid auth state
            localStorage.removeItem('token')
            localStorage.removeItem('user')

            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false
            })

            delete api.defaults.headers.common['Authorization']
          }
        } else {
          set({ isLoading: false })
        }
      },

      // Clear auth state
      clearAuth: () => {
        // Clear localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        delete api.defaults.headers.common['Authorization']
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export { useAuthStore }
