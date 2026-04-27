"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Package,
  PoundSterling,
  Calendar,
  UserCheck,
  FileText,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useCreateClient } from "@/hooks/useClients";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  package: z.string().min(1, "Select a package"),
  monthlyValue: z.number().min(1, "Enter monthly value"),
  invoiceDay: z.number().min(1).max(31),
  assignedTo: z.string().min(1, "Assign to a team member"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PACKAGES = [
  { name: "Starter", price: 450, desc: "Perfect for new restaurants. 8 posts/mo, basic reporting." },
  { name: "Social Growth", price: 850, desc: "Growing brands. 16 posts/mo, stories, analytics." },
  { name: "Brand Builder", price: 1400, desc: "Full-service content. 25+ posts, reels, monthly strategy call." },
  { name: "Enterprise", price: 2500, desc: "Multi-location. Bespoke strategy, dedicated account manager." },
];

const TEAM = ["Rohit", "Rohin", "Harpreet"];

const ONBOARDING_STEPS = [
  "Contract signed",
  "First payment received",
  "Brand assets collected",
  "Account access granted",
  "Kick-off call completed",
  "Questionnaire returned",
  "First content draft approved",
  "First post published",
];

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { invoiceDay: 1 },
  });

  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedMonthlyValue = watch("monthlyValue");
  const watchedAssignedTo = watch("assignedTo");
  const watchedInvoiceDay = watch("invoiceDay");

  const onSubmit = async (data: FormData) => {
    try {
      await createClient.mutateAsync(data);
      toast.success(`${data.name} added successfully`);
      router.push("/clients");
    } catch {
      toast.error("Failed to add client. Please try again.");
    }
  };

  const handlePackageSelect = (pkg: string) => {
    setSelectedPackage(pkg);
    setValue("package", pkg);
    const found = PACKAGES.find((p) => p.name === pkg);
    if (found && !watchedMonthlyValue) {
      setValue("monthlyValue", found.price);
    }
  };

  return (
    <div className="max-w-[1200px]">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> Back to clients
      </button>

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">New Client</p>
        <h1 className="text-3xl font-black tracking-tight text-black">Add New Client</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to onboard a new client into AgencyOS.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-[1fr_360px] gap-8 items-start">
          {/* ─── LEFT: Form ─── */}
          <div className="space-y-6">
            {/* Section: Client Identity */}
            <Section title="Client Identity" icon={<User size={14} />}>
              <Field label="Client Name" error={errors.name?.message} icon={<User size={13} />}>
                <input
                  {...register("name")}
                  className={inp(!!errors.name)}
                  placeholder="e.g. The Kelvin Kitchen"
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Email Address" error={errors.email?.message} icon={<Mail size={13} />}>
                  <input
                    {...register("email")}
                    type="email"
                    className={inp(!!errors.email)}
                    placeholder="hello@client.com"
                  />
                </Field>

                <Field label="Phone (optional)" icon={<Phone size={13} />}>
                  <input
                    {...register("phone")}
                    className={inp(false)}
                    placeholder="0141 555 0000"
                  />
                </Field>
              </div>
            </Section>

            {/* Section: Package */}
            <Section title="Package" icon={<Package size={14} />}>
              <div>
                <label className={labelCls}>Package</label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  {PACKAGES.map((pkg) => (
                    <button
                      key={pkg.name}
                      type="button"
                      onClick={() => handlePackageSelect(pkg.name)}
                      className={cn(
                        "text-left p-4 border rounded-lg transition-all",
                        selectedPackage === pkg.name
                          ? "border-red-500 bg-red-50 ring-1 ring-red-500/20"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{pkg.desc}</p>
                      <p className="text-sm font-black text-red-600 mt-2 font-mono">
                        £{pkg.price.toLocaleString("en-GB")}/mo
                      </p>
                    </button>
                  ))}
                </div>
                {/* hidden select to satisfy react-hook-form */}
                <select {...register("package")} className="sr-only" tabIndex={-1}>
                  <option value="">Select...</option>
                  {PACKAGES.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                {errors.package && (
                  <p className="text-xs text-red-600 font-medium mt-1.5">{errors.package.message}</p>
                )}
              </div>
            </Section>

            {/* Section: Billing */}
            <Section title="Billing" icon={<PoundSterling size={14} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly Value (£)" error={errors.monthlyValue?.message} icon={<PoundSterling size={13} />}>
                  <input
                    {...register("monthlyValue", { valueAsNumber: true })}
                    type="number"
                    className={inp(!!errors.monthlyValue)}
                    placeholder="850"
                    min={0}
                  />
                </Field>

                <Field label="Invoice Day" error={errors.invoiceDay?.message} icon={<Calendar size={13} />}>
                  <input
                    {...register("invoiceDay", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={31}
                    className={inp(!!errors.invoiceDay)}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Day of month invoice is raised</p>
                </Field>
              </div>
            </Section>

            {/* Section: Team */}
            <Section title="Internal" icon={<UserCheck size={14} />}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Assigned To</label>
                  <div className="flex gap-2 mt-1.5">
                    {TEAM.map((member) => (
                      <button
                        key={member}
                        type="button"
                        onClick={() => setValue("assignedTo", member)}
                        className={cn(
                          "flex-1 py-2.5 text-sm font-semibold border rounded-lg transition-all",
                          watchedAssignedTo === member
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                        )}
                      >
                        {member}
                      </button>
                    ))}
                  </div>
                  {/* hidden select for form validation */}
                  <select {...register("assignedTo")} className="sr-only" tabIndex={-1}>
                    <option value="">Select...</option>
                    {TEAM.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.assignedTo && (
                    <p className="text-xs text-red-600 font-medium mt-1.5">{errors.assignedTo.message}</p>
                  )}
                </div>

                <Field label="Internal Notes (optional)" icon={<FileText size={13} />}>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className={cn(inp(false), "resize-none")}
                    placeholder="Any context for the team..."
                  />
                </Field>
              </div>
            </Section>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2 pb-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSubmitting ? "Adding Client..." : "Add Client"}
                {!isSubmitting && <ChevronRight size={15} />}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* ─── RIGHT: Summary Panel ─── */}
          <div className="space-y-4 sticky top-8">
            {/* Client Preview Card */}
            <div className="border border-gray-200 bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-bold">Preview</p>
              </div>
              <div className="px-5 py-5 space-y-3">
                <div>
                  <p className="text-lg font-black tracking-tight text-black leading-tight">
                    {watchedName || <span className="text-gray-300">Client Name</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {watchedEmail || "email@client.com"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Package</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {selectedPackage || <span className="text-gray-300">—</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">MRR</p>
                    <p className="text-sm font-black text-black font-mono mt-0.5">
                      {watchedMonthlyValue
                        ? `£${Number(watchedMonthlyValue).toLocaleString("en-GB")}`
                        : <span className="text-gray-300">£—</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Invoice Day</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {watchedInvoiceDay ? `Day ${watchedInvoiceDay}` : "Day 1"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Assigned</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {watchedAssignedTo || <span className="text-gray-300">—</span>}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800">
                    Onboarding
                  </span>
                </div>
              </div>
            </div>

            {/* Onboarding checklist */}
            <div className="border border-gray-200 bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-bold">
                  Onboarding Checklist
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Steps will begin after client is added.
                </p>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {ONBOARDING_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-gray-200 shrink-0" />
                    <span className="text-xs text-gray-400">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <span className="text-gray-400">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">{title}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={cn(labelCls, "flex items-center gap-1.5")}>
        {icon && <span className="text-gray-300">{icon}</span>}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

const labelCls =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.16em]";

const inp = (hasError: boolean) =>
  cn(
    "w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 bg-white transition-all",
    hasError
      ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
      : "border-gray-200 focus:ring-red-500/20 focus:border-red-500"
  );
