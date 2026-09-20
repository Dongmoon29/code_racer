import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { LoginForm } from "../components/dynamic";
import Image from "next/image";
import { Alert } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/Loader";
import { useTranslation } from "next-i18next/pages";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { t } = useTranslation("common");

  useEffect(() => {
    // Only redirect if we're sure the user is logged in
    // and we're not still loading
    if (!isLoading && isLoggedIn) {
      // Check if there's a redirect URL
      const redirectUrl = router.query.redirect as string;
      const destination = redirectUrl || "/dashboard";
      router.replace(destination);
      return;
    }

    if (router.query.registered === "true") {
      setMessage(
        t("auth.registrationSuccess"),
      );
    }
  }, [isLoading, isLoggedIn, router.query, router, t]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <>
        <Head>
          <title>{t("nav.login")} | CodeRacer</title>
          <meta
            name="description"
            content="Login to CodeRacer to start competing in real-time coding challenges"
          />
        </Head>
        <div className="flex w-full min-h-[calc(100vh-80px)] items-center justify-center">
          <Loader variant="spinner" size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t("nav.login")} | CodeRacer</title>
        <meta
          name="description"
          content="Login to CodeRacer to start competing in real-time coding challenges"
        />
      </Head>
      <div className="flex w-full min-h-[calc(100vh-80px)]">
        {/* Left Column - Form */}
        <div className="flex w-full flex-col items-center justify-center p-5 sm:p-8 md:w-1/2 md:p-12">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-6 shadow-xl shadow-black/5 sm:p-8">
            <div className="mb-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-10)]">
                {t("auth.welcomeBack")}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                {t("auth.signInTitle")}
              </h1>
              <p className="mt-2 font-normal leading-6 text-[var(--gray-10)]">
                {t("auth.signInDescription")}
              </p>
            </div>
            {message && (
              <Alert variant="success" className="mb-6">
                <p>{message}</p>
              </Alert>
            )}
            <LoginForm />
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="hidden md:block md:w-1/2 overflow-hidden">
          <div className="relative h-full w-full">
            <motion.div
              className="relative h-full w-full"
              animate={{
                rotate: [0, 1, 0],
                x: [0, 2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/code_racer_hero.webp"
                alt={t("auth.illustrationAlt")}
                fill
                style={{ objectFit: "contain" }}
                className="p-4"
                priority
                sizes="50vw"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
