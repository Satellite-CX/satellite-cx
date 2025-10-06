import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { source } from "~/lib/source";
import type * as PageTree from "fumadocs-core/page-tree";
import { useMemo } from "react";
import { docs } from "../../../source.generated";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { getMDXComponents } from "~/components/mdx-components";
import { createClientLoader } from "fumadocs-mdx/runtime/vite";
import { baseOptions } from "~/lib/layout.shared";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await loader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const loader = createServerFn({
  method: "GET",
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    // Check if this is an OpenAPI page and pre-process the data
    let apiPageData = null;
    if (page.data._openapi) {
      try {
        // Import openapi only on server side
        const { openapi } = await import("~/lib/openapi");

        // Extract the APIPage props from the MDX content
        const apiPageProps = {
          document: "./petstore-openapi.json",
          operations: page.data._openapi.operations || [],
          webhooks: [],
          hasHead: false
        };

        // Get the processed API page props
        apiPageData = await openapi.getAPIPageProps(apiPageProps);
      } catch (error) {
        console.error("Error processing OpenAPI data:", error);
        apiPageData = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    return {
      tree: source.pageTree as object,
      path: page.path,
      apiPageData,
    };
  });

const clientLoader = createClientLoader(docs.doc, {
  id: "docs",
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={getMDXComponents()}
          />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(data.path);
  const tree = useMemo(
    () => transformPageTree(data.tree as PageTree.Folder),
    [data.tree]
  );

  return (
    <DocsLayout {...baseOptions()} tree={tree}>
      <Content />
    </DocsLayout>
  );
}

function transformPageTree(tree: PageTree.Folder): PageTree.Folder {
  function transform<T extends PageTree.Item | PageTree.Separator>(item: T) {
    if (typeof item.icon !== "string") return item;

    return {
      ...item,
      icon: (
        <span
          dangerouslySetInnerHTML={{
            __html: item.icon,
          }}
        />
      ),
    };
  }

  return {
    ...tree,
    index: tree.index ? transform(tree.index) : undefined,
    children: tree.children.map((item) => {
      if (item.type === "folder") return transformPageTree(item);
      return transform(item);
    }),
  };
}
