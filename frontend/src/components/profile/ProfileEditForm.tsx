import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';

export type LanguageOption =
  | ''
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'java'
  | 'rust';

export type ProfileFormValues = {
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
  homepage: yup.string().url('Invalid URL').optional(),
  linkedin: yup.string().url('Invalid URL').optional(),
  github: yup.string().url('Invalid URL').optional(),
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
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<ProfileFormValues>({
    defaultValues: initial,
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

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
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSubmitSuccess(true);
      if (onSaved) onSaved();
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update profile';
      setSubmitError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm">Homepage</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="https://example.com"
          {...register('homepage')}
        />
        {errors.homepage && (
          <p className="text-xs text-red-500">
            {errors.homepage.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm">LinkedIn</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="https://linkedin.com/in/your-id"
          {...register('linkedin')}
        />
      </div>

      <div>
        <label className="text-sm">GitHub</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2 bg-background"
          placeholder="https://github.com/your-id"
          {...register('github')}
        />
        {errors.github && (
          <p className="text-xs text-red-500">
            {errors.github.message as string}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Company</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2 bg-background"
            {...register('company')}
          />
          {errors.company && (
            <p className="text-xs text-red-500">
              {errors.company.message as string}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm">Job Title</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2 bg-background"
            {...register('job_title')}
          />
          {errors.job_title && (
            <p className="text-xs text-red-500">
              {errors.job_title.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm">Favorite Language</label>
        <Controller
          control={control}
          name="fav_language"
          render={({ field }) => (
            <select
              className="mt-1 w-full border rounded px-3 py-2 bg-background"
              {...field}
            >
              <option value="">Select</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="java">Java</option>
              <option value="rust">Rust</option>
              <option value="cpp">C++</option>
            </select>
          )}
        />
      </div>

      {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      {submitSuccess && (
        <p className="text-xs text-green-600">Saved successfully.</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !isDirty || !isValid}
        className="w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
