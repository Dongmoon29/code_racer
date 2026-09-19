import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { extractErrorMessage } from '@/lib/error-utils';

export type LanguageOption =
  | ''
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'java'
  | 'rust'
  | 'cpp';

export type ProfileFormValues = {
  name?: string;
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
};

type ProfileEditFormProps = {
  initial?: ProfileFormValues;
  onSaved?: () => void;
};

const schema: yup.ObjectSchema<ProfileFormValues> = yup.object({
  // Name must be required and within length bounds
  name: yup.string().required('Name is required').min(2).max(100),
  // Treat empty strings as undefined so optional URL fields don't invalidate the form
  homepage: yup
    .string()
    .transform((v) =>
      typeof v === 'string' && v.trim() === '' ? undefined : v
    )
    .url('Invalid URL')
    .optional(),
  linkedin: yup
    .string()
    .transform((v) =>
      typeof v === 'string' && v.trim() === '' ? undefined : v
    )
    .url('Invalid URL')
    .optional(),
  github: yup
    .string()
    .transform((v) =>
      typeof v === 'string' && v.trim() === '' ? undefined : v
    )
    .url('Invalid URL')
    .optional(),
  company: yup.string().max(255, 'Too long').optional(),
  job_title: yup.string().max(255, 'Too long').optional(),
  fav_language: yup.string().optional(),
});

export default function ProfileEditForm({
  initial,
  onSaved,
}: ProfileEditFormProps) {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: initial,
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  // When initial props are populated/changed asynchronously, sync them into the form
  useEffect(() => {
    if (initial) {
      reset(initial);
    }
  }, [initial, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const payload: ProfileFormValues = {
        ...values,
        fav_language: (values.fav_language || '')
          .toString()
          .toLowerCase() as LanguageOption,
      };
      await api.put('/users/profile', payload);
      // Refresh any cached user data so profile sections update immediately
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      reset(payload);
      setSubmitSuccess(true);
      if (onSaved) onSaved();
    } catch (e) {
      setSubmitError(extractErrorMessage(e, 'Failed to update profile'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="text-sm">Name</label>
        <input
          id="profile-name"
          autoComplete="name"
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="Your name"
          {...register('name')}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'profile-name-error' : undefined}
        />
        {errors.name && (
          <p id="profile-name-error" role="alert" className="text-xs text-red-500">
            {errors.name.message as string}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="profile-homepage" className="text-sm">Homepage</label>
        <input
          id="profile-homepage"
          type="url"
          autoComplete="url"
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="https://example.com"
          {...register('homepage')}
          aria-invalid={errors.homepage ? true : undefined}
          aria-describedby={errors.homepage ? 'profile-homepage-error' : undefined}
        />
        {errors.homepage && (
          <p id="profile-homepage-error" role="alert" className="text-xs text-red-500">
            {errors.homepage.message as string}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="profile-linkedin" className="text-sm">LinkedIn</label>
        <input
          id="profile-linkedin"
          type="url"
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="https://linkedin.com/in/your-id"
          {...register('linkedin')}
          aria-invalid={errors.linkedin ? true : undefined}
          aria-describedby={errors.linkedin ? 'profile-linkedin-error' : undefined}
        />
        {errors.linkedin && (
          <p id="profile-linkedin-error" role="alert" className="text-xs text-red-500">
            {errors.linkedin.message as string}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="profile-github" className="text-sm">GitHub</label>
        <input
          id="profile-github"
          type="url"
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="https://github.com/your-id"
          {...register('github')}
          aria-invalid={errors.github ? true : undefined}
          aria-describedby={errors.github ? 'profile-github-error' : undefined}
        />
        {errors.github && (
          <p id="profile-github-error" role="alert" className="text-xs text-red-500">
            {errors.github.message as string}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-company" className="text-sm">Company</label>
          <input
            id="profile-company"
            autoComplete="organization"
            className="mt-1 w-full border rounded px-3 py-2 bg-background"
            {...register('company')}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? 'profile-company-error' : undefined}
          />
          {errors.company && (
            <p id="profile-company-error" role="alert" className="text-xs text-red-500">
              {errors.company.message as string}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="profile-job-title" className="text-sm">Job Title</label>
          <input
            id="profile-job-title"
            autoComplete="organization-title"
            className="mt-1 w-full border rounded px-3 py-2 bg-background"
            {...register('job_title')}
            aria-invalid={errors.job_title ? true : undefined}
            aria-describedby={errors.job_title ? 'profile-job-title-error' : undefined}
          />
          {errors.job_title && (
            <p id="profile-job-title-error" role="alert" className="text-xs text-red-500">
              {errors.job_title.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="profile-language" className="text-sm">Favorite Language</label>
        <select
          id="profile-language"
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          {...register('fav_language')}
        >
          <option value="">Select</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="java">Java</option>
          <option value="rust">Rust</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      {submitError && <p role="alert" className="text-xs text-red-500">{submitError}</p>}
      {submitSuccess && (
        <p role="status" className="text-xs text-green-600">Saved successfully.</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !isDirty || !isValid}
        className="w-full"
        style={{ width: '100%', cursor: 'pointer' }}
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
