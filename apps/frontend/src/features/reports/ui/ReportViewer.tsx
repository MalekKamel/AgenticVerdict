"use client";

import { useEffect, useState } from "react";
import { Box, Text } from "@mantine/core";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ExcelViewer } from "./ExcelViewer";
import type { ReportContent } from "@agenticverdict/types";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReportViewerProps {
  content: ReportContent;
  zoom: number;
  reportFormat: string;
}

export function ReportViewer({ content, zoom, reportFormat }: ReportViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const setExcelError = useState<Error | null>(null)[1];

  useEffect(() => {
    setPageNumber(1);
    setExcelError(null);
  }, [content]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  if (reportFormat.toLowerCase() === "pdf" && content.pdfUrl) {
    return (
      <Box style={{ height: "100%", overflow: "auto" }}>
        <Document
          file={content.pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <Text ta="center" mt="xl">
              Loading PDF...
            </Text>
          }
          error={
            <Text ta="center" mt="xl" c="red">
              Failed to load PDF
            </Text>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={zoom / 100}
            renderAnnotationLayer={true}
            renderTextLayer={true}
          />
        </Document>

        {numPages > 1 && (
          <Box
            style={{
              position: "sticky",
              bottom: 0,
              background: "var(--mantine-color-body)",
              padding: "var(--mantine-spacing-sm)",
              borderTop: "1px solid var(--mantine-color-gray-3)",
              display: "flex",
              justifyContent: "center",
              gap: "var(--mantine-spacing-md)",
            }}
          >
            <Text size="sm">
              Page {pageNumber} of {numPages}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (reportFormat.toLowerCase() === "xlsx" && content.excelData) {
    return (
      <ExcelViewer
        data={content.excelData}
        onError={(error) => setExcelError(error ? new Error(error) : null)}
      />
    );
  }

  return (
    <Box p="xl">
      <Text c="dimmed" ta="center">
        Preview not available for this format. Please download the report.
      </Text>
    </Box>
  );
}
