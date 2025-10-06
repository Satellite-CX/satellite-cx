import { useState, useEffect } from 'react';

interface SimpleAPIPageProps {
  document: string;
  operations: Array<{ path: string; method: string }>;
}

export function SimpleAPIPage({ document, operations }: SimpleAPIPageProps) {
  const [apiSpec, setApiSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApiSpec() {
      try {
        setLoading(true);
        const response = await fetch(document);
        const spec = await response.json();
        setApiSpec(spec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load API spec');
      } finally {
        setLoading(false);
      }
    }

    loadApiSpec();
  }, [document]);

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

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-red-50">
        <h3 className="text-lg font-semibold mb-2 text-red-800">API Documentation Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!apiSpec) {
    return null;
  }

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-xl font-bold mb-4">API Documentation</h3>
      {operations.map(({ path, method }) => {
        const operation = apiSpec.paths?.[path]?.[method.toLowerCase()];
        if (!operation) return null;

        return (
          <div key={`${method}-${path}`} className="mb-6 border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                method === 'GET' ? 'bg-green-100 text-green-800' :
                method === 'POST' ? 'bg-blue-100 text-blue-800' :
                method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                method === 'DELETE' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {method}
              </span>
              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{path}</code>
            </div>

            <h4 className="font-semibold mb-2">{operation.summary || operation.operationId}</h4>

            {operation.description && (
              <p className="text-gray-600 mb-4">{operation.description}</p>
            )}

            {operation.parameters && (
              <div className="mb-4">
                <h5 className="font-medium mb-2">Parameters</h5>
                <div className="space-y-2">
                  {operation.parameters.map((param: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono">{param.name}</code>
                        <span className="text-xs text-gray-500">({param.in})</span>
                        {param.required && <span className="text-xs text-red-600">required</span>}
                      </div>
                      {param.description && (
                        <p className="text-sm text-gray-600">{param.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {operation.responses && (
              <div>
                <h5 className="font-medium mb-2">Responses</h5>
                <div className="space-y-2">
                  {Object.entries(operation.responses).map(([code, response]: [string, any]) => (
                    <div key={code} className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          code.startsWith('2') ? 'bg-green-100 text-green-800' :
                          code.startsWith('4') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {code}
                        </span>
                      </div>
                      {response.description && (
                        <p className="text-sm text-gray-600">{response.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}