import { create } from 'zustand'

interface ConnectivityState {
  online: boolean
  setOnline: (online: boolean) => void
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  online: navigator.onLine,
  setOnline: (online: boolean) => set({ online }),
}))
