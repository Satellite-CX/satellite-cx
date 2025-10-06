import { APIPage } from "fumadocs-openapi/ui";
import { openapi } from "~/lib/openapi";

interface ServerAPIPageProps {
  document: string;
  operations: Array<{ path: string; method: string }>;
  webhooks?: any[];
  hasHead?: boolean;
}

export async function ServerAPIPage(props: ServerAPIPageProps) {
  try {
    const apiPageProps = await openapi.getAPIPageProps(props);
    return <APIPage {...apiPageProps} />;
  } catch (error) {
    console.error("Error rendering API page:", error);
    return (
      <div className="border rounded-lg p-6 bg-red-50">
        <h3 className="text-lg font-semibold mb-2 text-red-800">API Documentation Error</h3>
        <p className="text-red-600 mb-4">
          Failed to load OpenAPI documentation.
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Error Details</summary>
          <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </details>
      </div>
    );
  }
}