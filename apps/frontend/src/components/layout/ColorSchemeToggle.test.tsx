import { render, screen, fireEvent } from "@testing-library/react";
import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ColorSchemeToggle } from "./ColorSchemeToggle";

// Mock Mantine hooks
vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual("@mantine/core");
  return {
    ...actual,
    useMantineColorScheme: vi.fn(),
    useComputedColorScheme: vi.fn(),
  };
});

const mockedUseMantineColorScheme = vi.mocked(useMantineColorScheme);
const mockedUseComputedColorScheme = vi.mocked(useComputedColorScheme);

describe("ColorSchemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with light mode icon", () => {
    mockedUseMantineColorScheme.mockReturnValue({
      colorScheme: "light",
      setColorScheme: vi.fn(),
      toggleColorScheme: vi.fn(),
      clearColorScheme: vi.fn(),
    });
    mockedUseComputedColorScheme.mockReturnValue("light");

    render(<ColorSchemeToggle />);
    const button = screen.getByTestId("color-scheme-toggle");
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("☾");
  });

  it("renders with dark mode icon", () => {
    mockedUseMantineColorScheme.mockReturnValue({
      colorScheme: "dark",
      setColorScheme: vi.fn(),
      toggleColorScheme: vi.fn(),
      clearColorScheme: vi.fn(),
    });
    mockedUseComputedColorScheme.mockReturnValue("dark");

    render(<ColorSchemeToggle />);
    const button = screen.getByTestId("color-scheme-toggle");
    expect(button.textContent).toBe("☀");
  });

  it("calls setColorScheme with opposite scheme when clicked", () => {
    const mockSetColorScheme = vi.fn();
    mockedUseMantineColorScheme.mockReturnValue({
      colorScheme: "light",
      setColorScheme: mockSetColorScheme,
      toggleColorScheme: vi.fn(),
      clearColorScheme: vi.fn(),
    });
    mockedUseComputedColorScheme.mockReturnValue("light");

    render(<ColorSchemeToggle />);
    const button = screen.getByTestId("color-scheme-toggle");
    fireEvent.click(button);

    expect(mockSetColorScheme).toHaveBeenCalledWith("dark");
  });

  it("calls onToggle callback when provided", () => {
    const mockSetColorScheme = vi.fn();
    const mockOnToggle = vi.fn();
    mockedUseMantineColorScheme.mockReturnValue({
      colorScheme: "dark",
      setColorScheme: mockSetColorScheme,
      toggleColorScheme: vi.fn(),
      clearColorScheme: vi.fn(),
    });
    mockedUseComputedColorScheme.mockReturnValue("dark");

    render(<ColorSchemeToggle onToggle={mockOnToggle} />);
    const button = screen.getByTestId("color-scheme-toggle");
    fireEvent.click(button);

    expect(mockSetColorScheme).toHaveBeenCalledWith("light");
    expect(mockOnToggle).toHaveBeenCalledWith("light");
  });
});
