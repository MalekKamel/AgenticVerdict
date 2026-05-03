/**
 * RegisterForm — Mantine form controls (`TextInput`, `PasswordInput`, `Alert`, `Button`, `Checkbox`).
 */

"use client";

import { useForm } from "@mantine/form";
import { useLocale, useTranslations } from "@/i18n/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  AUTH_TEXT_LINK_CLASS,
  AUTH_TRACK_MUTED_CLASS,
  getDirectionalSectionProps,
} from "@/features/auth/ui/authUi";
import { Link } from "@/i18n/navigation";
import { Alert, Button, Checkbox, List, Radio, Select, Text, TextInput } from "@mantine/core";
import { useRegisterMutation } from "@/features/auth/hooks/useRegisterMutation";
import {
  registerSchema,
  registerStepAccountTypeSchema,
  registerStepTenantSchema,
  type RegisterFormData,
} from "@/features/auth/model/validations/auth";
import { calculatePasswordStrength, type PasswordStrengthResult } from "@/lib/validations/password";
import { PasswordInput } from "@/features/auth/ui/PasswordInput";
import { IconCheck, IconUserPlus, IconX } from "@tabler/icons-react";
import { getDirection } from "@/i18n/locales";
import { getTenantIdForTrpcRequest } from "@agenticverdict/core/tenant/trpc-tenant-bridge";
import { isTenantUuid } from "@agenticverdict/core/tenant/tenant-resolution";
import { authStore } from "@/features/auth/model/state/auth-store";

const AUTH_PASSWORD_PREFIX = "auth.password.";

function passwordMessageKey(fullKey: string): string {
  return fullKey.startsWith(AUTH_PASSWORD_PREFIX)
    ? fullKey.slice(AUTH_PASSWORD_PREFIX.length)
    : fullKey;
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const t = useTranslations("auth");
  const [strength, setStrength] = useState<PasswordStrengthResult>(calculatePasswordStrength(""));

  useEffect(() => {
    setStrength(calculatePasswordStrength(password.length > 0 ? password : ""));
  }, [password]);

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div
        className={AUTH_TRACK_MUTED_CLASS}
        role="progressbar"
        aria-valuenow={strength.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("password.strength.label")}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${strength.percentage}%`, backgroundColor: strength.color }}
        />
      </div>
      <Text size="sm" c="dimmed">
        {t(`password.${passwordMessageKey(strength.label)}`)}
      </Text>

      <List
        data-testid="password-requirements"
        listStyleType="none"
        m={0}
        p={0}
        spacing="xs"
        size="sm"
      >
        {strength.requirements.map((req) => (
          <List.Item
            key={req.id}
            data-checked={req.met ? "true" : "false"}
            style={{
              color: req.met ? "var(--av-color-success)" : "var(--av-color-text-secondary)",
            }}
            icon={
              <span
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor: req.met
                    ? "var(--av-color-success)"
                    : "var(--av-color-border-subtle)",
                }}
                aria-hidden
              >
                {req.met ? <IconCheck size={10} stroke={3} /> : <IconX size={10} stroke={3} />}
              </span>
            }
          >
            <span id={req.ariaId}>{t(`password.requirements.${req.id}`)}</span>
          </List.Item>
        ))}
      </List>
    </div>
  );
}

export interface RegisterFormProps {
  onSuccess?: (data: RegisterFormData) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: ReactNode;
  initialAccountType?: "individual" | "business";
  initialPlan?: string;
  initialInviteCode?: string;
  initialTenantId?: string;
}

function localizeRegisterApiError(rawError: unknown, t: (key: string) => string): string {
  if (!(rawError instanceof Error)) {
    return t("register.errors.apiError");
  }

  const message = rawError.message;
  if (message.startsWith("auth.")) {
    return t(message.slice("auth.".length));
  }

  return t("register.errors.apiError");
}

type RegisterStep = 1 | 2 | 3 | 4;
export const REGISTER_DRAFT_KEY = "auth.register.multistep.draft.v1";

type RegisterDraft = RegisterFormData & {
  accountType: "individual" | "business";
  tenantName: string;
  tenantWebsite: string;
  tenantSize: "1-10" | "11-50" | "51-250" | "251+";
  plan?: string;
  inviteCode?: string;
};

type PersistedRegisterDraft = Omit<RegisterDraft, "password" | "confirmPassword">;

export function toPersistedRegisterDraft(draft: RegisterDraft): PersistedRegisterDraft {
  const safeDraft: Partial<RegisterDraft> = { ...draft };
  delete safeDraft.password;
  delete safeDraft.confirmPassword;
  return safeDraft as PersistedRegisterDraft;
}

function fromPersistedRegisterDraft(
  persistedDraft: PersistedRegisterDraft,
  initialAccountType: "individual" | "business" | undefined,
  initialPlan?: string,
  initialInviteCode?: string,
): RegisterDraft {
  return {
    ...makeInitialDraft(initialAccountType, initialPlan, initialInviteCode),
    ...persistedDraft,
    password: "",
    confirmPassword: "",
  };
}

function makeInitialDraft(
  initialAccountType: "individual" | "business" | undefined,
  initialPlan?: string,
  initialInviteCode?: string,
): RegisterDraft {
  return {
    accountType: initialAccountType ?? "business",
    tenantName: "",
    tenantWebsite: "",
    tenantSize: "1-10",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    acceptTerms: false,
    plan: initialPlan,
    inviteCode: initialInviteCode,
  };
}

export function RegisterForm({
  onSuccess,
  onError,
  className,
  children,
  initialAccountType,
  initialPlan,
  initialInviteCode,
  initialTenantId,
}: RegisterFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const isRtl = getDirection(locale) === "rtl";
  const register = useRegisterMutation();
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [draft, setDraft] = useState<RegisterDraft>(() =>
    makeInitialDraft(initialAccountType, initialPlan, initialInviteCode),
  );

  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const statusRegionRef = useRef<HTMLDivElement>(null);
  const resolvedTenantId = isTenantUuid(initialTenantId)
    ? initialTenantId
    : (getTenantIdForTrpcRequest() ?? authStore.state.tenantId ?? undefined);
  const verifyEmailHref = (() => {
    const params = new URLSearchParams({ email: draft.email });
    if (resolvedTenantId) {
      params.set("tenantId", resolvedTenantId);
    }
    return `/auth/verify-email?${params.toString()}`;
  })();

  const form = useForm<RegisterFormData>({
    validate: (values) => {
      const result = registerSchema.safeParse(values);
      if (!result.success) {
        const errors: Record<string, string> = {};
        const registerPrefix = "auth.register.";
        for (const issue of result.error.issues) {
          const path0 = issue.path[0];
          if (path0 === undefined) continue;
          const field = String(path0);
          const raw = issue.message;
          const subKey = raw.startsWith(registerPrefix) ? raw.slice(registerPrefix.length) : raw;
          errors[field] = t(`register.${subKey}`);
        }
        return errors;
      }

      if (values.password !== values.confirmPassword && values.confirmPassword) {
        return { confirmPassword: t("register.errors.passwordsDoNotMatch") };
      }

      return {};
    },
    initialValues: {
      email: draft.email,
      password: draft.password,
      confirmPassword: draft.confirmPassword,
      firstName: draft.firstName,
      lastName: draft.lastName,
      acceptTerms: draft.acceptTerms,
    },
  });
  const tenantForm = useForm({
    initialValues: {
      tenantName: draft.tenantName,
      tenantWebsite: draft.tenantWebsite,
      tenantSize: draft.tenantSize,
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { step: RegisterStep; draft: PersistedRegisterDraft };
      if (parsed?.draft) {
        const hydratedDraft = fromPersistedRegisterDraft(
          parsed.draft,
          initialAccountType,
          initialPlan,
          initialInviteCode,
        );
        setDraft(hydratedDraft);
        setCurrentStep(parsed.step ?? 1);
        form.setValues({
          email: hydratedDraft.email,
          password: "",
          confirmPassword: "",
          firstName: hydratedDraft.firstName,
          lastName: hydratedDraft.lastName,
          acceptTerms: hydratedDraft.acceptTerms,
        });
        tenantForm.setValues({
          tenantName: hydratedDraft.tenantName,
          tenantWebsite: hydratedDraft.tenantWebsite,
          tenantSize: hydratedDraft.tenantSize,
        });
      }
    } catch {
      return;
    }
  }, [form, initialAccountType, initialInviteCode, initialPlan, tenantForm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      REGISTER_DRAFT_KEY,
      JSON.stringify({
        step: currentStep,
        draft: toPersistedRegisterDraft(draft),
      }),
    );
  }, [currentStep, draft]);

  const watchedPassword = form.values.password;
  const watchedConfirmPassword = form.values.confirmPassword;

  useEffect(() => {
    if (watchedConfirmPassword.length > 0) {
      setPasswordsMatch(watchedPassword === watchedConfirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [watchedPassword, watchedConfirmPassword]);

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      await register.mutateAsync({
        ...values,
        accountType: draft.accountType,
        tenantName: draft.tenantName,
        tenantSize: draft.tenantSize,
        tenantWebsite: draft.tenantWebsite,
        tenantId: resolvedTenantId,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      }
      setCurrentStep(4);
      onSuccess?.(values);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const termsProps = form.getInputProps("acceptTerms", { type: "checkbox" });

  const stepProgress = (currentStep / 4) * 100;
  const accountTypeError = (() => {
    const result = registerStepAccountTypeSchema.safeParse({ accountType: draft.accountType });
    if (result.success) return undefined;
    return t("register.steps.accountType.errors.required");
  })();
  const handleAccountTypeNext = () => {
    if (!draft.accountType || accountTypeError) return;
    setCurrentStep(2);
  };
  const handleTenantNext = () => {
    const result = registerStepTenantSchema.safeParse(tenantForm.values);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        errors[key] = t(issue.message.slice("auth.".length));
      }
      tenantForm.setErrors(errors);
      return;
    }
    setDraft((previous) => ({ ...previous, ...tenantForm.values }));
    setCurrentStep(3);
  };
  const backStep = () => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as RegisterStep) : prev));

  useEffect(() => {
    if (register.isError || currentStep === 4) {
      statusRegionRef.current?.focus();
    }
  }, [currentStep, register.isError]);

  return (
    <div className={className}>
      {children}

      {register.isError ? (
        <div
          ref={statusRegionRef}
          className="mb-4"
          data-testid="form-error"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
        >
          <Alert color="red" title={t("register.errors.apiError")} variant="light">
            {localizeRegisterApiError(register.error, t)}
          </Alert>
        </div>
      ) : null}

      <div
        className={AUTH_TRACK_MUTED_CLASS}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={stepProgress}
        aria-label={t("register.steps.progress", { current: currentStep, total: 4 })}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${stepProgress}%`, backgroundColor: "var(--av-color-primary)" }}
        />
      </div>
      <Text size="sm" c="dimmed" mt="sm" mb="md">
        {t("register.steps.progress", { current: currentStep, total: 4 })}
      </Text>

      {currentStep === 1 ? (
        <div className="flex flex-col gap-5">
          <Text fw={600}>{t("register.steps.accountType.title")}</Text>
          <Radio.Group
            value={draft.accountType}
            onChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                accountType: value === "individual" ? "individual" : "business",
              }))
            }
            label={t("register.steps.accountType.label")}
          >
            <div className="flex flex-col gap-3">
              <Radio value="business" label={t("register.steps.accountType.options.business")} />
              <Radio
                value="individual"
                label={t("register.steps.accountType.options.individual")}
              />
            </div>
          </Radio.Group>
          {accountTypeError ? (
            <Text size="sm" c="red" role="alert">
              {accountTypeError}
            </Text>
          ) : null}
          <Button onClick={handleAccountTypeNext}>{t("register.buttons.next")}</Button>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="flex flex-col gap-5">
          <Text fw={600}>{t("register.steps.tenant.title")}</Text>
          <TextInput
            label={t("register.steps.tenant.fields.tenantName.label")}
            value={tenantForm.values.tenantName}
            onChange={(event) => tenantForm.setFieldValue("tenantName", event.currentTarget.value)}
            error={tenantForm.errors.tenantName}
            required
          />
          <Select
            label={t("register.steps.tenant.fields.tenantSize.label")}
            value={tenantForm.values.tenantSize}
            onChange={(value) =>
              tenantForm.setFieldValue(
                "tenantSize",
                (value ?? "1-10") as RegisterDraft["tenantSize"],
              )
            }
            data={[
              { value: "1-10", label: t("register.steps.tenant.fields.tenantSize.options.1_10") },
              { value: "11-50", label: t("register.steps.tenant.fields.tenantSize.options.11_50") },
              {
                value: "51-250",
                label: t("register.steps.tenant.fields.tenantSize.options.51_250"),
              },
              {
                value: "251+",
                label: t("register.steps.tenant.fields.tenantSize.options.251_plus"),
              },
            ]}
            error={tenantForm.errors.tenantSize}
            required
          />
          <TextInput
            label={t("register.steps.tenant.fields.tenantWebsite.label")}
            value={tenantForm.values.tenantWebsite}
            onChange={(event) =>
              tenantForm.setFieldValue("tenantWebsite", event.currentTarget.value)
            }
            error={tenantForm.errors.tenantWebsite}
          />
          <div className="flex gap-3">
            <Button variant="default" onClick={backStep}>
              {t("register.buttons.back")}
            </Button>
            <Button onClick={handleTenantNext}>{t("register.buttons.next")}</Button>
          </div>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <form
          onSubmit={form.onSubmit((values) => {
            setDraft((previous) => ({ ...previous, ...values }));
            return handleSubmit(values);
          })}
          noValidate
        >
          <div className="flex flex-col gap-5">
            <TextInput
              {...form.getInputProps("email")}
              id="register-email"
              name="email"
              type="email"
              label={t("register.fields.email.label")}
              required
              autoComplete="email"
              radius="md"
              w="100%"
              error={typeof form.errors.email === "string" ? form.errors.email : undefined}
              aria-invalid={!!form.errors.email}
            />

            <div>
              <PasswordInput
                {...form.getInputProps("password")}
                id="register-password"
                name="password"
                label={t("register.fields.password.label")}
                placeholder={t("register.fields.password.placeholder")}
                required
                autoComplete="new-password"
                error={typeof form.errors.password === "string" ? form.errors.password : undefined}
                radius="md"
                aria-invalid={!!form.errors.password}
                onChange={(e) => {
                  form.getInputProps("password").onChange(e);
                  setPasswordValue(e.target.value);
                }}
              />
              <PasswordStrengthIndicator password={passwordValue} />
            </div>

            <PasswordInput
              {...form.getInputProps("confirmPassword")}
              id="register-confirm-password"
              name="confirmPassword"
              label={t("register.fields.confirmPassword.label")}
              placeholder={t("register.fields.confirmPassword.placeholder")}
              error={
                (typeof form.errors.confirmPassword === "string"
                  ? form.errors.confirmPassword
                  : undefined) ||
                (passwordsMatch === false ? t("register.errors.passwordsDoNotMatch") : undefined)
              }
              required
              autoComplete="new-password"
              radius="md"
              aria-invalid={!!form.errors.confirmPassword || passwordsMatch === false}
            />

            {passwordsMatch === true && watchedConfirmPassword.length > 0 ? (
              <Text size="sm" c="green" className="inline-flex items-center gap-1.5">
                <IconCheck size={16} stroke={2.5} className="shrink-0" aria-hidden />
                {t("register.errors.passwordsMatch")}
              </Text>
            ) : null}

            <TextInput
              {...form.getInputProps("firstName")}
              id="register-first-name"
              name="firstName"
              label={t("register.fields.firstName.label")}
              required
              autoComplete="given-name"
              radius="md"
              w="100%"
              error={typeof form.errors.firstName === "string" ? form.errors.firstName : undefined}
              aria-invalid={!!form.errors.firstName}
            />

            <TextInput
              {...form.getInputProps("lastName")}
              id="register-last-name"
              name="lastName"
              label={t("register.fields.lastName.label")}
              required
              autoComplete="family-name"
              radius="md"
              w="100%"
              error={typeof form.errors.lastName === "string" ? form.errors.lastName : undefined}
              aria-invalid={!!form.errors.lastName}
            />

            <div className="flex flex-col gap-2">
              <Checkbox
                label={t("register.fields.acceptTerms.label")}
                id="register-accept-terms"
                checked={Boolean(termsProps.checked)}
                onChange={termsProps.onChange}
                description={
                  <Text size="sm" c="dimmed" component="span">
                    {t("register.fields.acceptTerms.description")}{" "}
                    <Link href="/auth/terms" className={AUTH_TEXT_LINK_CLASS}>
                      {t("register.fields.acceptTerms.termsLink")}
                    </Link>{" "}
                    {t("register.fields.acceptTerms.and")}{" "}
                    <Link href="/auth/privacy" className={AUTH_TEXT_LINK_CLASS}>
                      {t("register.fields.acceptTerms.privacyLink")}
                    </Link>
                  </Text>
                }
              />
              {form.errors.acceptTerms ? (
                <Text size="sm" c="red" role="alert">
                  {form.errors.acceptTerms}
                </Text>
              ) : null}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              radius="md"
              loading={register.isPending}
              disabled={register.isPending}
              aria-busy={register.isPending}
              {...getDirectionalSectionProps(
                !register.isPending ? (
                  <IconUserPlus size={20} stroke={1.75} aria-hidden />
                ) : undefined,
                isRtl,
              )}
            >
              {register.isPending
                ? t("register.buttons.creatingAccount")
                : t("register.buttons.createAccount")}
            </Button>
            <Button variant="default" onClick={backStep}>
              {t("register.buttons.back")}
            </Button>
          </div>
        </form>
      ) : null}

      {currentStep === 4 ? (
        <div
          ref={statusRegionRef}
          className="flex flex-col gap-4"
          role="status"
          aria-live="polite"
          tabIndex={-1}
        >
          <Alert color="green" title={t("register.steps.confirmation.title")} variant="light">
            {t("register.steps.confirmation.description")}
          </Alert>
          <Text size="sm" c="dimmed">
            {t("register.steps.confirmation.checkEmail", { email: draft.email })}
          </Text>
          <Button onClick={() => register.reset()} component={Link} href={verifyEmailHref}>
            {t("register.steps.confirmation.cta")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default RegisterForm;
