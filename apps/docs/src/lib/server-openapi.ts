import { createServerFn } from "@tanstack/react-start";
import { APIPage } from "fumadocs-openapi/ui";
import { openapi } from "./openapi";

export const getOpenAPIContent = createServerFn({
  method: "GET",
})
  .inputValidator((input: {
    document: string;
    operations: Array<{ path: string; method: string }>;
    webhooks?: any[];
    hasHead?: boolean;
  }) => input)
  .handler(async ({ data: props }) => {
    try {
      // Process the OpenAPI data on the server
      const apiPageProps = await openapi.getAPIPageProps(props);

      // Instead of returning the JSX element (which contains symbols),
      // return the processed data that can be serialized
      return {
        success: true,
        // Extract serializable data from the processed props
        data: {
          title: props.operations[0]?.path || "API Endpoint",
          operations: props.operations,
          // Add other serializable fields as needed
        }
      };
    } catch (error) {
      console.error("Error processing OpenAPI data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

// Server component that renders the APIPage
export async function ServerAPIPage(props: {
  document: string;
  operations: Array<{ path: string; method: string }>;
  webhooks?: any[];
  hasHead?: boolean;
}) {
  try {
    // This runs on the server and returns JSX
    const apiPageProps = await openapi.getAPIPageProps(props);
    return <APIPage {...apiPageProps} />;
  } catch (error) {
    console.error("Error in ServerAPIPage:", error);
    return (
      <div className="border rounded-lg p-6 bg-red-50">
        <h3 className="text-lg font-semibold mb-2 text-red-800">API Documentation Error</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}