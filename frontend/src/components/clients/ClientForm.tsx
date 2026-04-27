"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
});

type FormData = z.infer<typeof schema>;

const PACKAGES = ["Starter", "Social Growth", "Brand Builder", "Enterprise"];
const TEAM = ["Rohit", "Rohin", "Harpreet"];

export function ClientForm({ onClose }: { onClose: () => void }) {
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { invoiceDay: 1 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createClient.mutateAsync(data);
      toast.success(`${data.name} added successfully`);
      onClose();
    } catch {
      toast.error("Failed to add client. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Client Name" error={errors.name?.message}>
        <input
          {...register("name")}
          className={inp}
          placeholder="e.g. The Kelvin Kitchen"
          autoFocus
        />
      </Field>

      <Field label="Email Address" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          className={inp}
          placeholder="hello@client.com"
        />
      </Field>

      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input
          {...register("phone")}
          className={inp}
          placeholder="0141 555 0000"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Package" error={errors.package?.message}>
          <select {...register("package")} className={inp}>
            <option value="">Select...</option>
            {PACKAGES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Monthly Value (£)" error={errors.monthlyValue?.message}>
          <input
            {...register("monthlyValue", { valueAsNumber: true })}
            type="number"
            className={inp}
            placeholder="850"
            min={0}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Invoice Day" error={errors.invoiceDay?.message}>
          <input
            {...register("invoiceDay", { valueAsNumber: true })}
            type="number"
            min={1}
            max={31}
            className={inp}
          />
        </Field>

        <Field label="Assigned To" error={errors.assignedTo?.message}>
          <select {...register("assignedTo")} className={inp}>
            <option value="">Select...</option>
            {TEAM.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Adding..." : "Add Client"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inp =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white transition-all";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
