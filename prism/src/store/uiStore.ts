import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  isDetailPaneOpen: boolean
  activeModal: string | null
  isSearchOpen: boolean
  isMobileNavOpen: boolean

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  setDetailPaneOpen: (open: boolean) => void
  toggleDetailPane: () => void

  setActiveModal: (modal: string | null) => void
  openModal: (modal: string) => void
  closeModal: () => void

  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void

  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void

  closeAll: () => void
}

export const useUIStore = create<UIState>()((set, get) => ({
  isSidebarOpen: true,
  isDetailPaneOpen: false,
  activeModal: null,
  isSearchOpen: false,
  isMobileNavOpen: false,

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setDetailPaneOpen: (open) => set({ isDetailPaneOpen: open }),
  toggleDetailPane: () => set((state) => ({ isDetailPaneOpen: !state.isDetailPaneOpen })),

  setActiveModal: (modal) => set({ activeModal: modal }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),

  closeAll: () =>
    set({
      activeModal: null,
      isSearchOpen: false,
      isMobileNavOpen: false,
    }),
}))
