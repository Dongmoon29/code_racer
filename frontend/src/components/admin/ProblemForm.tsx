"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { ProblemFormData } from "@/types";
import { createProblem, updateProblem } from "@/lib/problem-api";
import { createDefaultFormData } from "./constants/problem-form-constants";
import ExamplesField from "./problem-form/ExamplesField";
import IOSchemaField from "./problem-form/IOSchemaField";
import TestCasesField from "./problem-form/TestCasesField";
import { validateProblemForm } from "./problem-form/validateProblemForm";

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
    <p role="alert" className="mt-1 text-xs text-red-500">
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
    mode: "onBlur",
  });

  useEffect(() => {
    reset(initialData ?? createDefaultFormData());
  }, [initialData, reset]);

  const onSubmit = async (formData: ProblemFormData) => {
    setSubmitError("");

    const validationError = validateProblemForm(formData);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

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
    <div className="mx-auto max-w-4xl rounded-lg p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold">
        {mode === "create" ? "Add New Problem" : "Edit Problem"}
      </h2>
      {submitError && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 p-4">
          <p className="text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="problem-title" className="mb-2 block text-sm font-medium">
              Title *
            </label>
            <input
              id="problem-title"
              type="text"
              {...register("title", { required: "Title is required" })}
              aria-invalid={errors.title ? true : undefined}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <label htmlFor="problem-difficulty" className="mb-2 block text-sm font-medium">
              Difficulty *
            </label>
            <select
              id="problem-difficulty"
              {...register("difficulty", { required: "Difficulty is required" })}
              aria-invalid={errors.difficulty ? true : undefined}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="problem-description" className="mb-2 block text-sm font-medium">
            Problem Description *
          </label>
          <textarea
            id="problem-description"
            {...register("description", {
              required: "Problem description is required",
            })}
            rows={4}
            aria-invalid={errors.description ? true : undefined}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FieldError message={errors.description?.message} />
        </div>

        <ExamplesField control={control} register={register} errors={errors} />

        <div>
          <label htmlFor="problem-constraints" className="mb-2 block text-sm font-medium">
            Constraints *
          </label>
          <textarea
            id="problem-constraints"
            {...register("constraints", { required: "Constraints are required" })}
            rows={2}
            aria-invalid={errors.constraints ? true : undefined}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1 <= nums.length <= 10^4"
          />
          <FieldError message={errors.constraints?.message} />
        </div>

        <Controller
          control={control}
          name="io_schema"
          render={({ field }) => (
            <IOSchemaField value={field.value} onChange={field.onChange} />
          )}
        />

        <div>
          <label htmlFor="problem-function-name" className="mb-2 block text-sm font-medium">
            Function Name *
          </label>
          <input
            id="problem-function-name"
            type="text"
            {...register("function_name", {
              required: "Function name is required",
              pattern: {
                value: /^[A-Za-z_][A-Za-z0-9_]*$/,
                message:
                  "Use letters, numbers, and underscores, starting with a letter or underscore",
              },
            })}
            aria-invalid={errors.function_name ? true : undefined}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="twoSum"
          />
          <FieldError message={errors.function_name?.message} />
        </div>

        <TestCasesField control={control} register={register} errors={errors} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="problem-time-limit" className="mb-2 block text-sm font-medium">
              Time Limit (ms)
            </label>
            <input
              id="problem-time-limit"
              type="number"
              {...register("time_limit", {
                valueAsNumber: true,
                required: "Time limit is required",
                min: { value: 100, message: "Minimum time limit is 100 ms" },
              })}
              aria-invalid={errors.time_limit ? true : undefined}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              step="100"
            />
            <FieldError message={errors.time_limit?.message} />
          </div>

          <div>
            <label htmlFor="problem-memory-limit" className="mb-2 block text-sm font-medium">
              Memory Limit (MB)
            </label>
            <input
              id="problem-memory-limit"
              type="number"
              {...register("memory_limit", {
                valueAsNumber: true,
                required: "Memory limit is required",
                min: { value: 16, message: "Minimum memory limit is 16 MB" },
              })}
              aria-invalid={errors.memory_limit ? true : undefined}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="16"
              step="16"
            />
            <FieldError message={errors.memory_limit?.message} />
          </div>
        </div>

        <div className="flex justify-end space-x-4 border-t pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
