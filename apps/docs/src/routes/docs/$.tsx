import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { source } from "~/lib/source";
import { docs } from "../../../source.generated";
import { createClientLoader } from "fumadocs-mdx/runtime/vite";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const data = await loader({ data: params._splat?.split("/") ?? [] });
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

    return {
      path: page.path,
    };
  });

const clientLoader = createClientLoader(docs.doc, {
  id: "docs",
  component({ frontmatter, default: MDX }) {
    return (
      <div className="prose">
        <h1>{frontmatter.title}</h1>
        <MDX />
      </div>
    );
  },
});

function Page() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(data.path);

  return <Content />;
}
