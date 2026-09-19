import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@/lib/error-utils";
import {
  formControlClass,
  formErrorClass,
  formHintClass,
  formLabelClass,
} from "@/components/ui/FormPrimitives";

export type LanguageOption =
  "" | "javascript" | "typescript" | "python" | "go" | "java" | "rust" | "cpp";

export type ProfileFormValues = {
  name: string;
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language: LanguageOption;
};

type ProfileEditFormProps = {
  initial?: ProfileFormValues;
  onSaved?: () => void;
};

const schema: yup.ObjectSchema<ProfileFormValues> = yup.object({
  // Name must be required and within length bounds
  name: yup.string().required("Name is required").min(2).max(100),
  // Treat empty strings as undefined so optional URL fields don't invalidate the form
  homepage: yup
    .string()
    .transform((v) =>
      typeof v === "string" && v.trim() === "" ? undefined : v,
    )
    .url("Invalid URL")
    .optional(),
  linkedin: yup
    .string()
    .transform((v) =>
      typeof v === "string" && v.trim() === "" ? undefined : v,
    )
    .url("Invalid URL")
    .optional(),
  github: yup
    .string()
    .transform((v) =>
      typeof v === "string" && v.trim() === "" ? undefined : v,
    )
    .url("Invalid URL")
    .optional(),
  company: yup.string().max(255, "Too long").optional(),
  job_title: yup.string().max(255, "Too long").optional(),
  fav_language: yup
    .mixed<LanguageOption>()
    .oneOf([
      "",
      "javascript",
      "typescript",
      "python",
      "go",
      "java",
      "rust",
      "cpp",
    ])
    .defined(),
});

export default function ProfileEditForm({
  initial,
  onSaved,
}: ProfileEditFormProps) {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: initial ?? { name: "", fav_language: "" },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  // When initial props are populated/changed asynchronously, sync them into the form
  useEffect(() => {
    if (initial) {
      reset(initial, { keepDirtyValues: true });
    }
  }, [initial, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitError(null);
    try {
      const payload: ProfileFormValues = {
        ...values,
        fav_language: values.fav_language.toLowerCase() as LanguageOption,
      };
      await api.put("/users/profile", payload);
      // Refresh any cached user data so profile sections update immediately
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      reset(payload);
      if (onSaved) onSaved();
    } catch (e) {
      setSubmitError(extractErrorMessage(e, "Failed to update profile"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-4 sm:p-5"
      noValidate
    >
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          Edit profile
        </h3>
        <p className={formHintClass}>
          Keep your public profile and coding preferences up to date.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="profile-name" className={formLabelClass}>
            Display name
          </label>
          <input
            id="profile-name"
            autoComplete="name"
            className={formControlClass}
            placeholder="How others will see you"
            {...register("name")}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
          />
          {errors.name && (
            <p id="profile-name-error" role="alert" className={formErrorClass}>
              {errors.name.message as string}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-company" className={formLabelClass}>
              Company
            </label>
            <input
              id="profile-company"
              autoComplete="organization"
              className={formControlClass}
              placeholder="Company or organization"
              {...register("company")}
              aria-invalid={errors.company ? true : undefined}
              aria-describedby={
                errors.company ? "profile-company-error" : undefined
              }
            />
            {errors.company && (
              <p
                id="profile-company-error"
                role="alert"
                className={formErrorClass}
              >
                {errors.company.message as string}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="profile-job-title" className={formLabelClass}>
              Job title
            </label>
            <input
              id="profile-job-title"
              autoComplete="organization-title"
              className={formControlClass}
              placeholder="Your role"
              {...register("job_title")}
              aria-invalid={errors.job_title ? true : undefined}
              aria-describedby={
                errors.job_title ? "profile-job-title-error" : undefined
              }
            />
            {errors.job_title && (
              <p
                id="profile-job-title-error"
                role="alert"
                className={formErrorClass}
              >
                {errors.job_title.message as string}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="profile-language" className={formLabelClass}>
            Favorite language
          </label>
          <select
            id="profile-language"
            className={formControlClass}
            {...register("fav_language")}
          >
            <option value="">Choose a language</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="java">Java</option>
            <option value="rust">Rust</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </div>

      <div className="border-t border-[var(--gray-6)] pt-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gray-10)]">
          Links
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="profile-homepage" className={formLabelClass}>
              Homepage
            </label>
            <input
              id="profile-homepage"
              type="url"
              autoComplete="url"
              className={formControlClass}
              placeholder="https://example.com"
              {...register("homepage")}
              aria-invalid={errors.homepage ? true : undefined}
              aria-describedby={
                errors.homepage ? "profile-homepage-error" : undefined
              }
            />
            {errors.homepage && (
              <p
                id="profile-homepage-error"
                role="alert"
                className={formErrorClass}
              >
                {errors.homepage.message as string}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-linkedin" className={formLabelClass}>
              LinkedIn
            </label>
            <input
              id="profile-linkedin"
              type="url"
              className={formControlClass}
              placeholder="https://linkedin.com/in/your-id"
              {...register("linkedin")}
              aria-invalid={errors.linkedin ? true : undefined}
              aria-describedby={
                errors.linkedin ? "profile-linkedin-error" : undefined
              }
            />
            {errors.linkedin && (
              <p
                id="profile-linkedin-error"
                role="alert"
                className={formErrorClass}
              >
                {errors.linkedin.message as string}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-github" className={formLabelClass}>
              GitHub
            </label>
            <input
              id="profile-github"
              type="url"
              className={formControlClass}
              placeholder="https://github.com/your-id"
              {...register("github")}
              aria-invalid={errors.github ? true : undefined}
              aria-describedby={
                errors.github ? "profile-github-error" : undefined
              }
            />
            {errors.github && (
              <p
                id="profile-github-error"
                role="alert"
                className={formErrorClass}
              >
                {errors.github.message as string}
              </p>
            )}
          </div>
        </div>
      </div>

      {submitError && (
        <p role="alert" className={formErrorClass}>
          {submitError}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting || !isDirty || !isValid}
        className="!h-11 w-full !rounded-xl"
      >
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
