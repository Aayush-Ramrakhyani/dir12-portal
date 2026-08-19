import { Check } from 'lucide-react';

interface Step {
  label: string;
  shortLabel?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function FormStepper({ steps, currentStep }: FormStepperProps) {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div
            key={step.label}
            className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? <Check size={14} /> : stepNum}
            </div>
            <div className="step-label">{step.shortLabel || step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
