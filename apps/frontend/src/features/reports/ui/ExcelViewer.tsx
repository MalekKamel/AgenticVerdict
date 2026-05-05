"use client";

import { useEffect, useState } from "react";
import { Box, Tabs, Table, Text, ScrollArea } from "@mantine/core";
import { utils, read } from "xlsx";
import type { WorkBook } from "xlsx";

interface ExcelViewerProps {
  data: ArrayBuffer;
  onError?: (error: string) => void;
}

export function ExcelViewer({ data, onError }: ExcelViewerProps) {
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const wb = read(data, { type: "array" });
      setWorkbook(wb);
      if (wb.SheetNames.length > 0) {
        setActiveSheet(wb.SheetNames[0]);
      }
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load Excel file";
      onError?.(errorMessage);
      setLoading(false);
    }
  }, [data, onError]);

  if (loading) {
    return (
      <Text ta="center" mt="xl">
        Loading Excel preview...
      </Text>
    );
  }

  if (!workbook || !activeSheet) {
    return (
      <Text ta="center" mt="xl" c="dimmed">
        No data available
      </Text>
    );
  }

  const worksheet = workbook.Sheets[activeSheet];
  const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

  if (jsonData.length === 0) {
    return (
      <Text ta="center" mt="xl" c="dimmed">
        Sheet is empty
      </Text>
    );
  }

  const headers = jsonData[0];
  const rows = jsonData.slice(1);

  return (
    <ScrollArea style={{ height: "100%" }}>
      <Box p="md">
        {workbook.SheetNames.length > 1 && (
          <Tabs value={activeSheet} onChange={(value) => value && setActiveSheet(value)} mb="md">
            <Tabs.List>
              {workbook.SheetNames.map((sheetName) => (
                <Tabs.Tab key={sheetName} value={sheetName}>
                  {sheetName}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        )}

        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{typeof header === "string" ? header : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((_, colIndex) => (
                  <td key={colIndex}>
                    {typeof row[colIndex] === "string"
                      ? row[colIndex]
                      : String(row[colIndex] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>

        {rows.length > 100 && (
          <Text ta="center" mt="md" c="dimmed" size="sm">
            Showing first 100 rows. Download for full data.
          </Text>
        )}
      </Box>
    </ScrollArea>
  );
}
