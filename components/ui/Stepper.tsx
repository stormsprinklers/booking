interface StepperProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function Stepper({ currentStep, totalSteps, labels }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isComplete = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold
                    transition-colors
                    ${isComplete ? "bg-[#4C9BC8] text-white" : ""}
                    ${isCurrent ? "bg-[#F17388] text-white ring-2 ring-[#F17388]/40" : ""}
                    ${!isComplete && !isCurrent ? "bg-[#F0F0F0] text-[#102341]/50" : ""}
                  `}
                >
                  {isComplete ? "✓" : stepNum}
                </div>
                {labels?.[i] && (
                  <span
                    className={`mt-1 text-xs font-medium ${
                      isCurrent ? "text-[#102341]" : "text-[#102341]/60"
                    }`}
                  >
                    {labels[i]}
                  </span>
                )}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`h-1 flex-1 rounded ${
                    isComplete ? "bg-[#4C9BC8]" : "bg-[#F0F0F0]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
