import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/auth/$role/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Legal Consultancy Service" },
      {
        name: "description",
        content: "Register as a client, advocate or administrator on Legal Consultancy Service.",
      },
      { property: "og:title", content: "Create your account — Legal Consultancy Service" },
      { property: "og:description", content: "Join India's smart legal consultation platform." },
    ],
  }),
  component: () => <AuthForm mode="register" />,
});