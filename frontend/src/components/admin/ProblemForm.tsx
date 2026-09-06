"use client";

import React, { useState, useEffect } from "react";
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

export default function ProblemForm({
  initialData,
  mode,
  onSuccess,
  onCancel,
}: ProblemFormProps) {
  const [formData, setFormData] = useState<ProblemFormData>(
    initialData || createDefaultFormData(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = <K extends keyof ProblemFormData>(
    field: K,
    value: ProblemFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateProblemForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createProblem(formData);
      } else if (initialData && initialData.id) {
        await updateProblem(initialData.id, {
          ...formData,
          id: initialData.id,
        });
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 ">
        {mode === "create" ? "Add New Problem" : "Edit Problem"}
      </h2>
      {error && (
        <div className="mb-4 p-4 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                handleInputChange(
                  "difficulty",
                  e.target.value as ProblemFormData["difficulty"],
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Problem Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <ExamplesField
          examples={formData.examples}
          onChange={(examples) => handleInputChange("examples", examples)}
        />

        {/* Constraints */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Constraints *
          </label>
          <textarea
            value={formData.constraints}
            onChange={(e) => handleInputChange("constraints", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1 <= nums.length <= 10^4"
            required
          />
        </div>

        <IOSchemaField
          value={formData.io_schema}
          onChange={(ioSchema) => handleInputChange("io_schema", ioSchema)}
        />

        {/* Function Name */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Function Name *
          </label>
          <input
            type="text"
            value={formData.function_name}
            onChange={(e) => handleInputChange("function_name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="twoSum"
            required
          />
        </div>

        <TestCasesField
          testCases={formData.test_cases}
          onChange={(testCases) => handleInputChange("test_cases", testCases)}
        />

        {/* Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Time Limit (ms)
            </label>
            <input
              type="number"
              value={formData.time_limit}
              onChange={(e) =>
                handleInputChange("time_limit", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Memory Limit (MB)
            </label>
            <input
              type="number"
              value={formData.memory_limit}
              onChange={(e) =>
                handleInputChange("memory_limit", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="16"
              step="16"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300  rounded-md hover:bg-gray-50"
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
