import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/auth/$role/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Legal Consultancy Service" },
      { name: "description", content: "Sign in to your Legal Consultancy Service client, lawyer or admin portal." },
      { property: "og:title", content: "Sign in — Legal Consultancy Service" },
      { property: "og:description", content: "Access your Legal Consultancy Service workspace securely." },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});