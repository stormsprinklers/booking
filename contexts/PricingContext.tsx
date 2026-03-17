"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { PricingInputs, PricingOption } from "@/lib/types";
import { getPricingOptions } from "@/lib/pricing/pricingEngine";

interface PricingContextValue {
  inputs: PricingInputs;
  setInputs: (updates: Partial<PricingInputs>) => void;
  options: PricingOption[];
  selectedOption: PricingOption | null;
  setSelectedOption: (opt: PricingOption | null) => void;
  computePricing: () => void;
}

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputsState] = useState<PricingInputs>({
    serviceCategory: "repair",
  });
  const [options, setOptions] = useState<PricingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PricingOption | null>(null);

  const setInputs = useCallback((updates: Partial<PricingInputs>) => {
    setInputsState((prev) => ({ ...prev, ...updates }));
  }, []);

  const computePricing = useCallback(() => {
    const opts = getPricingOptions(inputs);
    setOptions(opts);
    setSelectedOption(null);
  }, [inputs]);

  return (
    <PricingContext.Provider
      value={{
        inputs,
        setInputs,
        options,
        selectedOption,
        setSelectedOption,
        computePricing,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const ctx = useContext(PricingContext);
  if (!ctx) throw new Error("usePricing must be used within PricingProvider");
  return ctx;
}
