import { createServerFn } from "@tanstack/react-start";
import { APIPage } from "fumadocs-openapi/ui";
import { openapi } from "~/lib/openapi";
import { useState, useEffect } from "react";

interface APIPageProps {
  document: string;
  operations: Array<{ path: string; method: string }>;
  webhooks?: any[];
  hasHead?: boolean;
}

// Server function that renders the APIPage as a server component
export const renderAPIPage = createServerFn({
  method: "GET",
})
  .inputValidator((props: APIPageProps) => props)
  .handler(async ({ data: props }) => {
    try {
      // This runs on the server and can use React Server Components
      const { openapi } = await import("~/lib/openapi");
      const apiPageProps = await openapi.getAPIPageProps(props);

      // Since we can't serialize JSX elements, we'll return the HTML string
      // This is a workaround for the serialization issue
      const { renderToString } = await import("react-dom/server");
      const html = renderToString(<APIPage {...apiPageProps} />);

      return {
        success: true,
        html,
        props: apiPageProps
      };
    } catch (error) {
      console.error("Error rendering APIPage:", error);
      const errorHtml = `
        <div class="border rounded-lg p-6 bg-red-50">
          <h3 class="text-lg font-semibold mb-2 text-red-800">API Documentation Error</h3>
          <p class="text-red-600">${error instanceof Error ? error.message : String(error)}</p>
        </div>
      `;

      return {
        success: false,
        html: errorHtml,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

// Client component that displays the server-rendered content
export function RSCAPIPage(props: APIPageProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    renderAPIPage(props)
      .then((result) => {
        setContent(result.html);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading API page:", error);
        setContent(`<div class="text-red-600">Failed to load API documentation: ${error.message}</div>`);
        setLoading(false);
      });
  }, [props.document, JSON.stringify(props.operations)]);

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      className="openapi-content"
    />
  );
}