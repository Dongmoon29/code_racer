"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { ProblemFormData } from "@/types";
import { createProblem, updateProblem } from "@/lib/problem-api";
import { createDefaultFormData } from "./constants/problem-form-constants";
import ExamplesField from "./problem-form/ExamplesField";
import IOSchemaField from "./problem-form/IOSchemaField";
import TestCasesField from "./problem-form/TestCasesField";
import { problemFormSchema } from "./problem-form/problemFormSchema";
import {
  FormSection,
  formControlClass,
  formErrorClass,
  formHintClass,
  formLabelClass,
  primaryFormButtonClass,
  secondaryFormButtonClass,
} from "@/components/ui/FormPrimitives";

interface ProblemFormProps {
  initialData?: ProblemFormData;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

const difficultyOptions: ProblemFormData["difficulty"][] = [
  "Easy",
  "Medium",
  "Hard",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={formErrorClass}>
      {message}
    </p>
  );
}

export default function ProblemForm({
  initialData,
  mode,
  onSuccess,
  onCancel,
}: ProblemFormProps) {
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProblemFormData>({
    defaultValues: initialData ?? createDefaultFormData(),
    resolver: yupResolver(problemFormSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    reset(initialData ?? createDefaultFormData());
  }, [initialData, reset]);

  const onSubmit = async (formData: ProblemFormData) => {
    setSubmitError("");

    try {
      if (mode === "create") {
        await createProblem(formData);
      } else if (initialData?.id) {
        await updateProblem(initialData.id, {
          ...formData,
          id: initialData.id,
        });
      }
      onSuccess?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred",
      );
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-10)]">
          Problem library
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {mode === "create" ? "Add a new problem" : "Edit problem"}
        </h2>
        <p className="mt-2 max-w-2xl font-normal leading-6 text-[var(--gray-10)]">
          Define the challenge, function contract, and judge cases. Required
          fields are marked with an asterisk.
        </p>
      </div>
      {submitError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <p className="text-sm text-red-500">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormSection
          title="Challenge details"
          description="Write the learner-facing prompt and choose how difficult the problem should be."
          headingId="challenge-details-heading"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label htmlFor="problem-title" className={formLabelClass}>
                  Title *
                </label>
                <input
                  id="problem-title"
                  type="text"
                  {...register("title")}
                  aria-invalid={errors.title ? true : undefined}
                  className={formControlClass}
                  placeholder="Two Sum"
                />
                <FieldError message={errors.title?.message} />
              </div>
              <div>
                <label htmlFor="problem-difficulty" className={formLabelClass}>
                  Difficulty *
                </label>
                <select
                  id="problem-difficulty"
                  {...register("difficulty")}
                  aria-invalid={errors.difficulty ? true : undefined}
                  className={formControlClass}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.difficulty?.message} />
              </div>
            </div>
            <div>
              <label htmlFor="problem-description" className={formLabelClass}>
                Problem description *
              </label>
              <textarea
                id="problem-description"
                {...register("description")}
                rows={6}
                aria-invalid={errors.description ? true : undefined}
                className={formControlClass}
                placeholder="Explain the task, inputs, and expected result."
              />
              <FieldError message={errors.description?.message} />
            </div>
            <div>
              <label htmlFor="problem-constraints" className={formLabelClass}>
                Constraints *
              </label>
              <textarea
                id="problem-constraints"
                {...register("constraints")}
                rows={3}
                aria-invalid={errors.constraints ? true : undefined}
                className={formControlClass}
                placeholder="1 <= nums.length <= 10^4"
              />
              <FieldError message={errors.constraints?.message} />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Examples"
          description="Add examples that teach users how inputs map to outputs."
          headingId="examples-section-heading"
        >
          <ExamplesField
            control={control}
            register={register}
            errors={errors}
          />
        </FormSection>

        <FormSection
          title="Function contract"
          description="Define the function name, ordered parameters, and return type used by every language template."
          headingId="function-contract-heading"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="problem-function-name" className={formLabelClass}>
                Function name *
              </label>
              <input
                id="problem-function-name"
                type="text"
                {...register("function_name")}
                aria-invalid={errors.function_name ? true : undefined}
                className={formControlClass}
                placeholder="twoSum"
              />
              <p className={formHintClass}>
                Use the exact identifier that starter code and the judge will
                call.
              </p>
              <FieldError message={errors.function_name?.message} />
            </div>
            <Controller
              control={control}
              name="io_schema"
              render={({ field }) => (
                <IOSchemaField value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </FormSection>

        <FormSection
          title="Judge cases"
          description="Inputs and expected outputs are JSON. Add enough cases to cover normal and edge conditions."
          headingId="judge-cases-heading"
        >
          <TestCasesField
            control={control}
            register={register}
            errors={errors}
          />
        </FormSection>

        <FormSection
          title="Execution limits"
          description="Set the maximum resources allowed for each submission."
          headingId="execution-limits-heading"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="problem-time-limit" className={formLabelClass}>
                Time limit (ms)
              </label>
              <input
                id="problem-time-limit"
                type="number"
                {...register("time_limit", { valueAsNumber: true })}
                aria-invalid={errors.time_limit ? true : undefined}
                className={formControlClass}
                min="100"
                step="100"
              />
              <FieldError message={errors.time_limit?.message} />
            </div>
            <div>
              <label htmlFor="problem-memory-limit" className={formLabelClass}>
                Memory limit (MB)
              </label>
              <input
                id="problem-memory-limit"
                type="number"
                {...register("memory_limit", { valueAsNumber: true })}
                aria-invalid={errors.memory_limit ? true : undefined}
                className={formControlClass}
                min="16"
                step="16"
              />
              <FieldError message={errors.memory_limit?.message} />
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)]/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={secondaryFormButtonClass}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={primaryFormButtonClass}
          >
            {isSubmitting
              ? "Processing..."
              : mode === "create"
                ? "Add Problem"
                : "Update Problem"}
          </button>
        </div>
      </form>
    </div>
  );
}
