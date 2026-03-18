"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  Customer,
  AvailabilitySlot,
  PricingOption,
  ServiceCategoryId,
} from "@/lib/types";

interface BookingState {
  serviceCategory: ServiceCategoryId;
  pricingOption: PricingOption | null;
  address: string;
  serviceAreaId: string | null;
  slot: AvailabilitySlot | null;
  customer: Partial<Customer>;
  lastCreateJobDebug: Record<string, unknown> | null;
}

interface BookingContextValue extends BookingState {
  setServiceCategory: (c: ServiceCategoryId) => void;
  setPricingOption: (o: PricingOption | null) => void;
  setAddress: (a: string) => void;
  setServiceAreaId: (id: string | null) => void;
  setSlot: (s: AvailabilitySlot | null) => void;
  setCustomer: (c: Partial<Customer>) => void;
  updateCustomer: (updates: Partial<Customer>) => void;
  setLastCreateJobDebug: (debug: Record<string, unknown> | null) => void;
  reset: () => void;
}

const initialState: BookingState = {
  serviceCategory: "repair",
  pricingOption: null,
  address: "",
  serviceAreaId: null,
  slot: null,
  customer: {},
  lastCreateJobDebug: null,
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  const setServiceCategory = useCallback((serviceCategory: ServiceCategoryId) => {
    setState((s) => ({ ...s, serviceCategory }));
  }, []);

  const setPricingOption = useCallback((pricingOption: PricingOption | null) => {
    setState((s) => ({ ...s, pricingOption }));
  }, []);

  const setAddress = useCallback((address: string) => {
    setState((s) => ({ ...s, address }));
  }, []);

  const setServiceAreaId = useCallback((serviceAreaId: string | null) => {
    setState((s) => ({ ...s, serviceAreaId }));
  }, []);

  const setSlot = useCallback((slot: AvailabilitySlot | null) => {
    setState((s) => ({ ...s, slot }));
  }, []);

  const setCustomer = useCallback((customer: Partial<Customer>) => {
    setState((s) => ({ ...s, customer }));
  }, []);

  const updateCustomer = useCallback((updates: Partial<Customer>) => {
    setState((s) => ({ ...s, customer: { ...s.customer, ...updates } }));
  }, []);

  const setLastCreateJobDebug = useCallback((lastCreateJobDebug: Record<string, unknown> | null) => {
    setState((s) => ({ ...s, lastCreateJobDebug }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        ...state,
        setServiceCategory,
        setPricingOption,
        setAddress,
        setServiceAreaId,
        setSlot,
        setCustomer,
        updateCustomer,
        setLastCreateJobDebug,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
