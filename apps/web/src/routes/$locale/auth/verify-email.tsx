import { Box, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";

export const Route = createFileRoute("/$locale/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAFAFA",
        padding: "16px",
      }}
    >
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailClient />
      </Suspense>
    </Box>
  );
}

function VerifyEmailFallback() {
  return (
    <Box
      style={{
        width: "100%",
        maxWidth: "480px",
        padding: "24px",
        backgroundColor: "white",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <Box
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid #E3F2FD",
          borderTop: "4px solid #1976D2",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px",
        }}
      />
      <Text c="dimmed">Loading...</Text>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
