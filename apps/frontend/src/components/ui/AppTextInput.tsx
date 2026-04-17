"use client";

import { TextInput, type TextInputProps } from "@mantine/core";

export type AppTextInputProps = TextInputProps;

export function AppTextInput(props: AppTextInputProps) {
  return <TextInput radius="md" {...props} />;
}
